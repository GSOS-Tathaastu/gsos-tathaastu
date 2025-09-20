import { NextResponse } from "next/server";
import { getDbOrNull } from "@/lib/mongo";
import { generateQuestionnaire } from "@/lib/questionGen";

async function readBody(req: Request) {
  try { return await req.json(); } catch { return {}; }
}

export async function POST(req: Request) {
  const body = await readBody(req);
  const {
    roleMain, roleSub, company, country, email,
    revenue, employees, operations, yearsActive, seedNotes
  } = body || {};

  const role = [roleMain, roleSub].filter(Boolean).join(" / ");
  const db = await getDbOrNull();

  // Always attempt to generate questions (from DB chunks or local JSON)
  const gen = await generateQuestionnaire({
    role,
    country,
    company,
    email,
    seedNotes:
      seedNotes ||
      `Revenue=${revenue || "-"}, Employees=${employees || "-"}, Ops=${operations || "-"}, Years=${yearsActive || "-"}`
  });

  if (!db) {
    // DB is unavailable → return questions so the user can preview,
    // but no session is created.
    return NextResponse.json({
      ok: true,
      sessionId: null,
      questions: gen.questions,
      source: gen.source, // "local" if fell back to JSON
      note: "DB unavailable; returned questions generated from local JSON chunks."
    });
  }

  // DB available → persist as usual
  const sessions = db.collection("survey_sessions");
  const doc = {
    email: (email || "").toLowerCase().trim(),
    role,
    country,
    company: company || "",
    status: "in_progress",
    startedAt: new Date(),
    updatedAt: new Date(),
    meta: { revenue, employees, operations, yearsActive },
    answers: [] as any[],
    questions: gen.questions,
  };
  const created = await sessions.insertOne(doc);

  return NextResponse.json({
    ok: true,
    sessionId: created.insertedId.toString(),
    questions: gen.questions,
    source: gen.source
  });
}
