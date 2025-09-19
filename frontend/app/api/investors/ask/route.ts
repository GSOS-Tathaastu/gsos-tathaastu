// frontend/app/api/investors/ask/route.ts
import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongo";
import { openai } from "@/lib/openai";

const DB = process.env.MONGODB_DB || "gsos";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { name = "", email = "", amount = "", equity = "", question = "" } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "name and email are required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DB);
    const col = db.collection("investor_questions");

    // Optional AI answer – only if OPENAI_API_KEY is present
    let aiAnswer: string | undefined;
    if (process.env.OPENAI_API_KEY && question) {
      const r = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are GSOS investor assistant. Answer briefly using 3–5 bullets plus a one-line summary. If details are confidential, add: 'Confidential Information, will be shared during in-person meeting'.",
          },
          { role: "user", content: question },
        ],
        temperature: 0.3,
      });
      aiAnswer = r.choices?.[0]?.message?.content || "";
    }

    const doc = {
      name,
      email: String(email).toLowerCase().trim(),
      amount,
      equity,
      question,
      answer: aiAnswer,
      createdAt: new Date(),
      meta: {
        ip: req.headers.get("x-forwarded-for") || "local",
        ua: req.headers.get("user-agent") || "",
      },
    };
    await col.insertOne(doc);

    return NextResponse.json({ ok: true, answer: aiAnswer || null });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
