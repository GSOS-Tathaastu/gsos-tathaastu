// frontend/app/api/survey/answer/route.ts
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDbOrNull } from "@/lib/mongo";
import { openai } from "@/lib/openai";

type Body = {
  sessionId?: string;
  email?: string;
  role?: string;
  country?: string;
  answers: any[];
  questions?: any[];
  finalize?: boolean;
  aiSummary?: boolean;
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

    const db = await getDbOrNull();
    if (!db) {
      return NextResponse.json(
        { ok: false, error: "Database not connected (set MONGO_URI & MONGO_DB)" },
        { status: 200 }
      );
    }

    const sessions = db.collection("survey_sessions");
    const submissions = db.collection("submissions");

    // ensure session exists
    let sessionId = payload.sessionId;
    let session: any = null;
    if (sessionId) {
      try {
        session = await sessions.findOne({ _id: new ObjectId(sessionId) });
      } catch {
        session = null;
      }
    }
    if (!session) {
      const newSession = {
        email: payload.email?.toLowerCase().trim() || "",
        role: payload.role || "",
        country: payload.country || "",
        status: "in_progress",
        startedAt: new Date(),
        answers: [],
      };
      const created = await sessions.insertOne(newSession);
      sessionId = created.insertedId.toString();
      session = { _id: created.insertedId, ...newSession };
    }

    // update session
    const update: any = {
      $set: {
        email: payload.email?.toLowerCase().trim() || session.email || "",
        role: payload.role || session.role || "",
        country: payload.country || session.country || "",
        updatedAt: new Date(),
      },
      $push: {
        answers: {
          $each: payload.answers.map((a: any) => ({ ...a, ts: new Date() })),
        },
      },
    };

    if (payload.questions && Array.isArray(payload.questions)) {
      update.$set.questions = payload.questions;
    }
    if (payload.finalize) {
      update.$set.status = "completed";
      update.$set.completedAt = new Date();
    }

    await sessions.updateOne({ _id: new ObjectId(sessionId!) }, update, { upsert: true });

    // optional AI summary
    let aiSummary: string | null = null;
    if (payload.aiSummary && process.env.OPENAI_API_KEY) {
      try {
        const compact = payload.answers
          .map((a: any, idx: number) => {
            const qid = a?.questionId ?? a?.id ?? `q${idx + 1}`;
            return `• ${qid}: ${JSON.stringify(a?.value)}`;
          })
          .join("\n");

        const sys =
          "You are an analyst summarizing a short business survey. Produce 4–6 crisp bullets focusing on goals, blockers, and recommended GSOS modules.";
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
      } catch {
        aiSummary = null;
      }
    }

    // record submission
    await submissions.insertOne({
      sessionId,
      email: payload.email?.toLowerCase().trim() || session.email || "",
      role: payload.role || session.role || "",
      country: payload.country || session.country || "",
      answers: payload.answers,
      questions: payload.questions || null,
      aiSummary,
      createdAt: new Date(),
      finalized: !!payload.finalize,
      source: "survey/answer",
    });

    return NextResponse.json({ ok: true, sessionId, aiSummary });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
