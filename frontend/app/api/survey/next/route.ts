// frontend/app/api/survey/next/route.ts
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDbOrNull } from "@/lib/mongo";
import { generateQuestionnaire } from "@/lib/questionGen";

/** Helpers */
function safeObjectId(id?: string | null) {
  try {
    return id ? new ObjectId(id) : null;
  } catch {
    return null;
  }
}

function ok(payload: Record<string, any>, status = 200) {
  return NextResponse.json({ ok: true, ...payload }, { status });
}
function err(message: string, status = 200) {
  // 200 with ok:false keeps client-side happy while still surfacing the error
  return NextResponse.json({ ok: false, error: message }, { status });
}

/** Core handler used by both GET and POST */
async function handleNext(input: {
  sessionId?: string | null;
  email?: string | null;
  role?: string | null;
  country?: string | null;
  seedNotes?: string | null;
}) {
  const db = await getDbOrNull();

  // If DB is not available, still return a safe JSON payload
  if (!db) {
    return ok({
      sessionId: input.sessionId || null,
      next: null,
      answered: 0,
      total: 0,
      finished: false,
      note: "DB not connected",
    });
  }

  const sessions = db.collection("survey_sessions");
  const id = safeObjectId(input.sessionId);
  let session: any = null;

  // Try to load existing session
  if (id) {
    session = await sessions.findOne({ _id: id });
  }

  // If no session found, try to create a fresh one using the generator
  if (!session) {
    const role = input.role || "";
    const country = input.country || "";
    const email = (input.email || "").toLowerCase().trim();
    const seedNotes = input.seedNotes || "";

    // Generate questionnaire (with fallback if generation fails)
    let questions: any[] = [];
    try {
      const gen = await generateQuestionnaire({
        role,
        country,
        company: "",
        email,
        seedNotes,
      });
      questions = Array.isArray(gen?.questions) ? gen.questions : [];
    } catch {
      // Fallback minimal question set to keep UX unblocked
      questions = [
        { id: "q1", type: "mcq", prompt: "Primary trade pain point?", options: ["Payments", "Logistics", "Compliance", "Other"] },
        { id: "q2", type: "likert", prompt: "We have strong cross-border KYC/KYB." },
        { id: "q3", type: "open", prompt: "Describe your biggest challenge in one line." },
      ];
    }

    const doc = {
      email,
      role,
      country,
      status: "in_progress",
      startedAt: new Date(),
      updatedAt: new Date(),
      answers: [] as any[],
      questions,
    };

    const created = await sessions.insertOne(doc);
    session = { ...doc, _id: created.insertedId };
  }

  // Compute progress and next question
  const answered = Array.isArray(session.answers) ? session.answers.length : 0;
  const total = Array.isArray(session.questions) ? session.questions.length : 0;

  if (total > 0 && answered >= total) {
    return ok({
      finished: true,
      sessionId: session._id.toString(),
      next: null,
      answered,
      total,
    });
  }

  const nextQ = total > 0 ? session.questions[answered] || null : null;

  return ok({
    finished: false,
    sessionId: session._id.toString(),
    next: nextQ,
    answered,
    total,
  });
}

/** GET /api/survey/next?sessionId=... */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");
    const email = searchParams.get("email");
    const role = searchParams.get("role");
    const country = searchParams.get("country");
    const seedNotes = searchParams.get("seedNotes");
    return await handleNext({ sessionId, email, role, country, seedNotes });
  } catch (e: any) {
    return err(e?.message || "Survey next failed (GET)", 500);
  }
}

/** POST /api/survey/next  (preferred) */
export async function POST(req: Request) {
  try {
    // Be defensive about non-JSON or empty body
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const { sessionId, email, role, country, seedNotes } = body || {};
    return await handleNext({ sessionId, email, role, country, seedNotes });
  } catch (e: any) {
    return err(e?.message || "Survey next failed (POST)", 500);
  }
}
