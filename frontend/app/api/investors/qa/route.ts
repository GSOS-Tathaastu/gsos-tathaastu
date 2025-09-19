// frontend/app/api/investors/qa/route.ts
import { NextResponse } from "next/server";
import { getDbOrNull } from "@/lib/mongo";
import { embedTexts, cosine } from "@/lib/embedding";
import { openai } from "@/lib/openai";

type QaBody = {
  question?: string;
  topK?: number;          // default 5
  minScore?: number;      // default 0.2
};

type ChunkDoc = {
  _id?: any;
  title?: string;
  docId?: string;
  page?: number;
  text?: string;          // some repos name this 'text'
  content?: string;       // others use 'content'
  embedding?: number[];   // numeric vector
  updatedAt?: string | Date;
};

export async function POST(req: Request) {
  try {
    const { question, topK = 5, minScore = 0.2 } = (await req.json()) as QaBody;

    if (!question || !question.trim()) {
      return NextResponse.json(
        { ok: false, error: "Missing 'question' in body" },
        { status: 400 }
      );
    }

    // --- DB guard ---
    const db = await getDbOrNull();
    if (!db) {
      return NextResponse.json(
        {
          ok: false,
          error: "Database not connected (set MONGO_URI & MONGO_DB)",
          answer: null,
          sources: [],
        },
        { status: 200 }
      );
    }

    // --- Load candidate chunks (defensive projection) ---
    // Adjust the collection name if your embeddings live elsewhere.
    const chunksCol = db.collection<ChunkDoc>("chunks");
    const candidates = await chunksCol
      .find({}, { projection: { _id: 0, title: 1, docId: 1, page: 1, text: 1, content: 1, embedding: 1, updatedAt: 1 } })
      .limit(4000) // be conservative; tune as needed
      .toArray();

    if (!candidates.length) {
      return NextResponse.json(
        {
          ok: false,
          error: "No chunks found in 'chunks' collection",
          answer: null,
          sources: [],
        },
        { status: 200 }
      );
    }

    // --- Embed query ---
    const [qVec] = await embedTexts([question]); // expects number[] back

    // --- Rank by cosine similarity (skip docs without embedding) ---
    const scored = candidates
      .filter(c => Array.isArray(c.embedding) && c.embedding.length)
      .map(c => {
        const txt = (c.text || c.content || "").toString();
        return {
          score: cosine(qVec, c.embedding as number[]),
          title: c.title || "",
          docId: c.docId || "",
          page: typeof c.page === "number" ? c.page : undefined,
          snippet: txt.length > 700 ? txt.slice(0, 700) + "…" : txt,
        };
      })
      .filter(s => s.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.max(1, Math.min(20, topK))); // cap context to keep prompt small

    // If no relevant matches, return a friendly response
    if (!scored.length) {
      return NextResponse.json(
        {
          ok: true,
          answer:
            "I couldn’t find relevant material in the knowledge base for this question. Try rephrasing or widening the scope.",
          sources: [],
        },
        { status: 200 }
      );
    }

    // --- Build compact context for the LLM ---
    const contextBlocks = scored.map((s, idx) => {
      const meta = [s.title, s.docId, s.page != null ? `p.${s.page}` : ""]
        .filter(Boolean)
        .join(" • ");
      return `[#${idx + 1} | ${meta} | score=${s.score.toFixed(3)}]\n${s.snippet}`;
    });

    const systemPrompt =
      "You are an expert GSOS analyst. Answer factually and concisely using ONLY the provided context. If the answer is not in context, say you don't know and suggest next steps (e.g., contact, module to explore). Include a short, non-speculative rationale only if helpful. Do not invent sources.";

    const userPrompt = [
      `Question: ${question}`,
      "",
      "Context:",
      contextBlocks.join("\n\n---\n\n"),
      "",
      "Instructions:",
      "- If you cite, refer to the bracketed chunk numbers like [#1], [#2].",
      "- Keep the answer under 180 words unless strictly necessary.",
    ].join("\n");

    // --- Call OpenAI (model can be adjusted via env if you prefer) ---
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
    });

    const answer = completion.choices?.[0]?.message?.content?.trim() || "";

    // Return answer with top sources (strip snippets in sources list)
    const sources = scored.map(({ snippet, ...rest }) => rest);

    return NextResponse.json({
      ok: true,
      answer,
      sources,
      used: { topK, minScore },
      ts: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
