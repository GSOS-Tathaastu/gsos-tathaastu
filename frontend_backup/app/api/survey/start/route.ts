import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongo";
import { openai } from "@/lib/openai";
import type { SurveySession, QuestionMeta } from "@/lib/types";

const BACKEND_URL = process.env.BACKEND_URL || "";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const role = String(body.role || "retailer");
    const participant = body.participant || {};
    const seed = body.seed ? String(body.seed) : undefined;

    // Initial questions from Railway (≥10)
    const url = `${BACKEND_URL.replace(/\/$/,"")}/generate?role=${encodeURIComponent(role)}&count=12${seed?`&seed=${encodeURIComponent(seed)}`:""}`;
    const r = await fetch(url);
    const data = await r.json();
    if (!r.ok || !data?.questions) {
      return NextResponse.json({ error: "generator_failed", details: data }, { status: 502 });
    }

    const currentBatch: QuestionMeta[] = data.questions;

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "gsos");
    const sessions = db.collection<SurveySession>("survey_sessions");

    const doc: SurveySession = {
      role,
      participant: {
        name: participant.name?.trim(),
        email: participant.email?.trim()?.toLowerCase(),
        company: participant.company?.trim(),
        phone: participant.phone?.trim(),
        country: participant.country?.trim(),
      },
      seed,
      status: "active",
      startedAt: new Date(),
      currentBatch,
      answers: [],
      summary: "",
    };

    const { insertedId } = await sessions.insertOne(doc);
    return NextResponse.json({ ok: true, sessionId: insertedId, currentBatch });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
