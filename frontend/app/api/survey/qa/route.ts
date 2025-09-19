// frontend/app/api/survey/qa/route.ts
import { NextResponse } from "next/server";
import { getDbOrNull } from "@/lib/mongo";
import { openai } from "@/lib/openai";

export async function POST(req: Request) {
  try {
    const { question } = await req.json();

    if (!question || typeof question !== "string") {
      return NextResponse.json(
        { ok: false, error: "Missing question" },
        { status: 400 }
      );
    }

    const db = await getDbOrNull();
    if (!db) {
      return NextResponse.json(
        { ok: false, error: "Database not connected (set MONGO_URI & MONGO_DB)" },
        { status: 200 }
      );
    }

    // simple AI answer
    let aiAnswer: string | null = null;
    if (process.env.OPENAI_API_KEY) {
      try {
        const completion = await openai.chat.completions.create({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are an assistant answering investor questions about GSOS." },
            { role: "user", content: question },
          ],
        });
        aiAnswer = completion.choices?.[0]?.message?.content?.trim() || null;
      } catch {
        aiAnswer = null;
      }
    }

    return NextResponse.json({ ok: true, aiAnswer });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
