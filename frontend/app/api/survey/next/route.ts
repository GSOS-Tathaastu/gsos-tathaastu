// frontend/app/api/survey/next/route.ts
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDbOrNull } from "@/lib/mongo";
import { getSurvey } from "@/lib/questionBank";
import type { SurveySession } from "@/lib/types";

type Body = {
  sessionId?: string;
  email?: string;
  role?: string;
  country?: string;
};

export async function POST(req: Request) {
  try {
    const { sessionId: incomingId, email = "", role = "retailer", country = "India" } =
      (await req.json()) as Body;

    const db = await getDbOrNull();
    if (!db) {
      return NextResponse.json(
        { ok: false, error: "Database not connected (set MONGO_URI & MONGO_DB)" },
        { status: 200 }
      );
    }

    const sessions = db.collection<SurveySession>("survey_sessions");
    let sessionId = incomingId;
    let session: SurveySession | null = null;

    // load or create session
    if (sessionId) {
      try {
        session = await sessions.findOne({ _id: new ObjectId(sessionId) });
      } catch {
        session = null;
      }
    }
    if (!session) {
      const doc: Partial<SurveySession> = {
        email: email.toLowerCase().trim(),
        role,
        country,
        status: "in_progress",
        startedAt: new Date(),
        answers: [],
      };
      const created = await sessions.insertOne(doc as any);
      sessionId = created.insertedId.toString();
      session = { _id: created.insertedId, ...(doc as any) } as SurveySession;
    } else {
      // update meta
      await sessions.updateOne(
        { _id: new ObjectId(sessionId!) },
        {
          $set: {
            email: email ? email.toLowerCase().trim() : ((session as any).email || ""),
            role,
            country,
            updatedAt: new Date(),
          },
        }
      );
    }

    // fetch questions (use any[] to avoid type mismatch)
    const def = getSurvey(role, country);
    const questions: any[] = def?.questions || [];

    const answered = Array.isArray((session as any).answers)
      ? (session as any).answers.length
      : 0;
    const total = questions.length;

    if (answered >= total) {
      await sessions.updateOne(
        { _id: new ObjectId(sessionId!) },
        { $set: { status: "completed", completedAt: new Date() } }
      );
      return NextResponse.json({
        ok: true,
        finished: true,
        sessionId,
        total,
        answered,
        next: null,
      });
    }

    const nextQ = questions[answered] || null;

    return NextResponse.json({
      ok: true,
      finished: false,
      sessionId,
      total,
      answered,
      next: nextQ,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
