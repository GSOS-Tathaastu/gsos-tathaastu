import clientPromise from "@/lib/mongo";
import { embedTexts, cosine } from "@/lib/embedding";
import { openai } from "@/lib/openai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { question } = await req.json();
    if (!question || question.trim().length < 5)
      return NextResponse.json({ error: "Question too short" }, { status: 400 });

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "gsos");
    const col = db.collection("chunks");

    const [qVec] = await embedTexts([question]);

    const candidates = await col.find({}, { projection: { text: 1, source: 1, embedding: 1 } })
      .limit(5000).toArray();

    const scored = candidates.map((c: any) => ({ ...c, score: cosine(qVec, c.embedding) }))
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 6);

    const context = scored.map((c: any, i: number) => `[${i+1} | ${c.source||"local"}] ${c.text}`).join("\n\n");

    const system = `You are GSOS-TATHAASTU's investor assistant. Answer in 4–7 crisp bullet points using only the provided context. Include numbers and facts when present. If you don't find an answer, say so.`;

    const chat = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        { role: "user", content: `Question: ${question}\n\nContext:\n${context}` },
      ],
    });

    const answer = chat.choices?.[0]?.message?.content || "(no answer)";
    return NextResponse.json({
      ok: true,
      answer,
      sources: scored.map((s: any) => ({ source: s.source, score: Number(s.score?.toFixed?.(3) || 0) })),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
