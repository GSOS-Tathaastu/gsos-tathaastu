import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDbOrNull } from "@/lib/mongo";
import type { SurveySession } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const { sessionId, answer, finalize, aiSummary } = await req.json();
    if (!sessionId || !answer?.qid) {
      return NextResponse.json({ ok: false, error: "bad_request" }, { status: 200 });
    }

    const db = await getDbOrNull();
    if (!db) {
      return NextResponse.json({ ok: false, error: "db_down" }, { status: 200 });
    }

    const sessions = db.collection("survey_sessions");
    const _id = new ObjectId(sessionId);
    const session = (await sessions.findOne({ _id })) as SurveySession | null;
    if (!session) return NextResponse.json({ ok: false, error: "session_not_found" }, { status: 200 });

    // Upsert answer (replace if same qid)
    const rest = (session.answers || []).filter((a) => a.qid !== answer.qid);
    const newAnswers = [...rest, { qid: String(answer.qid), value: answer.value }];

    const done = newAnswers.length >= (session.questions?.length || 0);
    await sessions.updateOne(
      { _id },
      {
        $set: {
          answers: newAnswers,
          status: done ? "done" : "in_progress",
          updatedAt: new Date(),
        },
      }
    );

    // Optional finalization & AI summary path can remain as you had
    return NextResponse.json({ ok: true, done }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "submit_failed" }, { status: 200 });
  }
}
