// frontend/app/api/investors/ask/route.ts
import { NextResponse } from "next/server";
import { getDbOrNull } from "@/lib/mongo";

type AskBody = {
  name?: string;
  email?: string;
  company?: string;
  question?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AskBody;

    if (!body?.name || !body?.email || !body?.question) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields: name, email, question" },
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

    const doc = {
      name: String(body.name).trim(),
      email: String(body.email).trim().toLowerCase(),
      company: String(body.company || "").trim(),
      question: String(body.question).trim(),
      createdAt: new Date(),
      source: "investors/ask",
    };

    await db.collection("investor_questions").insertOne(doc);

    return NextResponse.json({ ok: true, id: doc.email + ":" + doc.createdAt.toISOString() });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
