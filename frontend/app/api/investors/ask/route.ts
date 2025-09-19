// frontend/app/api/investors/ask/route.ts
import { NextResponse } from "next/server";
import { getDbOrNull } from "@/lib/mongo";
import { openai, OPENAI_MODEL } from "@/lib/openai";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body?.name || !body?.email || !body?.question) {
      return NextResponse.json({ ok: false, error: "name, email, question are required" }, { status: 400 });
    }

    const db = await getDbOrNull();
    if (!db) return NextResponse.json({ ok: false, error: "DB not connected" }, { status: 200 });

    let aiAnswer: string | null = null;
    if (process.env.OPENAI_API_KEY) {
      try {
        const c = await openai.chat.completions.create({
          model: OPENAI_MODEL,
          temperature: 0.2,
          messages: [
            { role: "system", content: "You answer investor questions about GSOS with precision and brevity." },
            { role: "user", content: body.question },
          ],
        });
        aiAnswer = c.choices?.[0]?.message?.content?.trim() || null;
      } catch {
        aiAnswer = null;
      }
    }

    await db.collection("investor_questions").insertOne({
      name: String(body.name).trim(),
      email: String(body.email).toLowerCase().trim(),
      company: String(body.company || "").trim(),
      question: String(body.question).trim(),
      aiAnswer,
      createdAt: new Date(),
    });

    return NextResponse.json({ ok: true, id: `${String(body.email).toLowerCase().trim()}:${Date.now()}` });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Unknown error" }, { status: 500 });
  }
}
