// frontend/app/api/survey/next/route.ts
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDbOrNull } from "@/lib/mongo";
import { generateQuestionnaire } from "@/lib/questionGen";
import type { SurveySession, Question } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const { sessionId, email, role, country, seedNotes } = await req.json();
    const db = await getDbOrNull();
    if (!db) return NextResponse.json({ ok: false, error: "DB not connected" }, { status: 200 });

    const sessions = db.collection("survey_sessions");
    let session: SurveySession | null = null;

    if (sessionId) {
      try {
        session = (await sessions.findOne({ _id: new ObjectId(sessionId) })) as any;
      } catch {
        session = null;
      }
    }

    if (!session) {
      // new session → generate questions
      const { questions } = await generateQuestionnaire({ role, country, company: "", email, seedNotes });
      const newSession: SurveySession = {
        email: email?.toLowerCase().trim() || "",
        role,
        country,
        status: "in_progress",
        startedAt: new Date(),
        answers: [],
        questions,
      };
      const created = await sessions.insertOne(newSession);
      session = { ...newSession, _id: created.insertedId };
    }

    const answered = session.answers?.length || 0;
    const total = session.questions?.length || 0;

    if (answered >= total) {
      return NextResponse.json({ ok: true, finished: true, sessionId: session._id.toString() });
    }

    const nextQ: Question | null = session.questions?.[answered] || null;

    return NextResponse.json({
      ok: true,
      sessionId: session._id.toString(),
      next: nextQ,
      answered,
      total,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "Survey next failed" }, { status: 500 });
  }
}
