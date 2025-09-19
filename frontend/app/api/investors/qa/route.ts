// frontend/app/api/investors/qa/route.ts
import { NextResponse } from "next/server";
import { getDbOrNull } from "@/lib/mongo";
import { embedTexts, cosine } from "@/lib/embedding";
import { openai, OPENAI_MODEL } from "@/lib/openai";

export async function POST(req: Request) {
  try {
    const { question, topK = 5, minScore = 0.2 } = await req.json();
    if (!question) return NextResponse.json({ ok: false, error: "question required" }, { status: 400 });

    const db = await getDbOrNull();
    if (!db) return NextResponse.json({ ok: false, error: "DB not connected" }, { status: 200 });

    const chunks = await db.collection("chunks")
      .find({}, { projection: { _id: 0, title: 1, docId: 1, page: 1, text: 1, content: 1, embedding: 1 } })
      .limit(4000)
      .toArray();

    const items = chunks.filter((c: any) => Array.isArray(c.embedding)).map((c: any) => ({
      title: c.title || "", docId: c.docId || "", page: typeof c.page === "number" ? c.page : undefined,
      text: (c.text || c.content || "").toString(), emb: c.embedding as number[]
    }));

    if (!items.length) return NextResponse.json({ ok: false, error: "No chunks present" }, { status: 200 });

    const [qv] = await embedTexts([question]);
    const ranked = items.map((i) => ({ score: cosine(qv, i.emb), ...i }))
      .filter((r) => r.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.max(1, Math.min(20, topK)));

    if (!ranked.length) return NextResponse.json({ ok: true, answer: "No relevant context found.", sources: [] });

    const ctx = ranked.map((r, idx) => `[#${idx + 1} | ${[r.title, r.docId, r.page ? `p.${r.page}` : ""].filter(Boolean).join(" • ")} | score=${r.score.toFixed(3)}]\n${r.text.slice(0, 800)}`).join("\n\n---\n\n");

    const c = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      temperature: 0.2,
      messages: [
        { role: "system", content: "Answer using ONLY the provided context. If missing, say you don’t know." },
        { role: "user", content: `Question: ${question}\n\nContext:\n${ctx}` },
      ],
    });

    const answer = c.choices?.[0]?.message?.content?.trim() || "";
    const sources = ranked.map(({ text, emb, ...rest }) => rest);
    return NextResponse.json({ ok: true, answer, sources });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Unknown error" }, { status: 500 });
  }
}
