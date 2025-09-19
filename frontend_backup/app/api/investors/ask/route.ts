// app/api/investors/ask/route.ts
import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongo";
import { verify, cookieName } from "@/lib/cookies";
// ⬇️ removed: import { rateLimit } from "@/lib/ratelimit";
import { openai, OPENAI_MODEL } from "@/lib/openai";

const DB = process.env.MONGODB_DB || "gsos";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // ⬇️ removed rateLimit check, was here
    // await rateLimit(req);

    const client = await clientPromise;
    const db = client.db(DB);

    // your existing logic to process investor Q&A
    const q = {
      ...body,
      createdAt: new Date(),
    };
    await db.collection("investorQuestions").insertOne(q);

    const r = await openai.responses.create({
      model: OPENAI_MODEL,
      input: `Investor asked: ${body.question}\nGive 3 bullet points and a commentary.`,
      temperature: 0.4,
    });

    return NextResponse.json({
      ok: true,
      answer: r.output_text,
      retrieved: [], // left blank (no retriever hooked here)
    });
  } catch (err: any) {
    console.error("investors/ask error", err);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
