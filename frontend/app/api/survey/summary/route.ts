// frontend/app/api/survey/summary/route.ts
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDbOrNull } from "@/lib/mongo";
import type { SurveySession } from "@/lib/types";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");
    if (!sessionId) return NextResponse.json({ ok: false, error: "sessionId required" }, { status: 400 });

    const db = await getDbOrNull();
    if (!db) return NextResponse.json({ ok: false, error: "DB not connected" }, { status: 200 });

    const sessions = db.collection("survey_sessions");
    const session = (await sessions.findOne({ _id: new ObjectId(sessionId) })) as SurveySession | null;

    if (!session) return NextResponse.json({ ok: false, error: "Session not found" }, { status: 404 });

    return NextResponse.json({ ok: true, answers: session.answers, questions: session.questions });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Unknown error" }, { status: 500 });
  }
}
