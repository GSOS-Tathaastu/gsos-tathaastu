// frontend/app/api/survey/answer/route.ts
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDbOrNull } from "@/lib/mongo";
import { openai } from "@/lib/openai";
import type { SurveySession, AnswerRecord, QuestionMeta } from "@/lib/types";

/**
 * Expected POST body
 */
type Body = {
  sessionId?: string;                    // optional (will create if missing)
  email?: string;
  role?: string;
  country?: string;
  answers: AnswerRecord[];               // [{ questionId, value, meta? }, ...]
  questions?: QuestionMeta[];            // optional: question metadata snapshot
  finalize?: boolean;                    // mark session completed
  aiSummary?: boolean;                   // if true, will attempt to generate a brief AI summary
};

export async function POST(req: Request) {
  try {
    const payload = (await req.json()) as Body;

    if (!payload?.answers || !Array.isArray(payload.answers)) {
      return NextResponse.json(
        { ok: false, error: "Invalid body: 'answers'[] is required" },
        { status: 400 }
      );
    }

    // Connect DB (graceful if not configured)
    const db = await getDbOrNull();
    if (!db) {
      // Still return success-ish so UI flows don’t break in preview environments
      return NextResponse.json(
        {
          ok: false,
          error: "Database not connected (set MONGO_URI & MONGO_DB)",
          session: null,
        },
        { status: 200 }
      );
    }

    const sessions = db.collection<SurveySession>("survey_sessions");
    const submissions = db.collection("submissions");

    // 1) Ensure a session exists (create or load)
    let sessionId = payload.sessionId;
    let session: any = null;

    if (!sessionId) {
      const newSession: Partial<SurveySession> = {
        email: payload.email?.toLowerCase().trim() || "",
        role: payload.role || "",
        country: payload.country || "",
        startedAt: new Date(),
        status: "in_progress",
      } as any;

      const created = await sessions.insertOne(newSession as any);
      sessionId = created.insertedId.toString();
      session = { _id: created.insertedId, ...newSession };
    } else {
      // load existing session
      try {
        const _id = new ObjectId(sessionId);
        session = await sessions.findOne({ _id });
      } catch {
        // bad sessionId string
      }
      if (!session) {
        // create a new session if lookup failed
        const newSession: Partial<SurveySession> = {
          email: payload.email?.toLowerCase().trim() || "",
          role: payload.role || "",
          country: payload.country || "",
          startedAt: new Date(),
          status: "in_progress",
        } as any;
        const created = await sessions.insertOne(newSession as any);
        sessionId = created.insertedId.toString();
        session = { _id: created.insertedId, ...newSession };
      }
    }

    // 2) Append answers to the session
    const update: any = {
      $setOnInsert: { startedAt: new Date() },
      $set: {
        email: payload.email?.toLowerCase().trim() || session?.email || "",
        role: payload.role || session?.role || "",
        country: payload.country || session?.country || "",
        updatedAt: new Date(),
      },
      $push: {
        answers: {
          $each: payload.answers.map((a) => ({
            ...a,
            ts: new Date(),
          })),
        },
      },
    };

    // Optionally snapshot questions
    if (payload.questions && Array.isArray(payload.questions)) {
      update.$set.questions = payload.questions;
    }

    // Finalize?
    if (payload.finalize) {
      update.$set.status = "completed";
      update.$set.completedAt = new Date();
    }

    await sessions.updateOne(
      { _id: new ObjectId(sessionId) },
      update,
      { upsert: true }
    );

    // 3) Optional: AI summary of answers for submissions
    let aiSummary: string | null = null;
    if (payload.aiSummary && process.env.OPENAI_API_KEY) {
      try {
        const compact = payload.answers
          .map((a) => `• ${a.questionId}: ${JSON.stringify(a.value)}`)
          .join("\n");

        const sys =
          "You are an analyst summarizing a short business survey. Produce a crisp 4-6 bullet summary focusing on goals, blockers, and immediate module recommendations. Do not fabricate facts.";
        const user = [
          `Role: ${payload.role || "-"}`,
          `Country: ${payload.country || "-"}`,
          `Email: ${payload.email || "-"}`,
          "",
          "Answers:",
          compact,
        ].join("\n");

        const completion = await openai.chat.completions.create({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          temperature: 0.2,
          messages: [
            { role: "system", content: sys },
            { role: "user", content: user },
          ],
        });

        aiSummary = completion.choices?.[0]?.message?.content?.trim() || null;
      } catch (e) {
        // ignore AI errors; continue
        aiSummary = null;
      }
    }

    // 4) Insert/Update a submission summary doc (for quick reporting)
    const submissionDoc = {
      sessionId,
      email: payload.email?.toLowerCase().trim() || session?.email || "",
      role: payload.role || session?.role || "",
      country: payload.country || session?.country || "",
      answers: payload.answers,
      questions: payload.questions || null,
      aiSummary,
      createdAt: new Date(),
      finalized: !!payload.finalize,
      source: "survey/answer",
    };

    await submissions.insertOne(submissionDoc);

    return NextResponse.json({
      ok: true,
      sessionId,
      aiSummary,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
