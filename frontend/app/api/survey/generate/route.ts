// frontend/app/api/survey/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getDbOrNull } from "@/lib/mongo";
import { openai } from "@/lib/openai";
import { generateQuestions } from "@/lib/questionGen";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      company,
      roleMain,
      roleSub,
      country,
      email,
      revenue,
      employees,
      operations,
      yearsActive,
    } = body;

    if (!roleMain || !roleSub || !country || !email) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const db = await getDbOrNull();
    if (!db) {
      return NextResponse.json(
        { ok: false, error: "DB connection failed" },
        { status: 500 }
      );
    }

    // Build audience context
    const audience = {
      roleMain,
      roleSub,
      company,
      country,
      email,
      revenue,
      employees,
      operations,
      yearsActive,
    };

    // ✅ Generate role-based questions via helper
    const questions = await generateQuestions({ audience });

    // Insert session into Mongo
    const sessions = db.collection("survey_sessions");
    const session = {
      email: email.toLowerCase(),
      roleMain,
      roleSub,
      country,
      company,
      revenue,
      employees,
      operations,
      yearsActive,
      questions,
      answers: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const { insertedId } = await sessions.insertOne(session);

    return NextResponse.json({ ok: true, sessionId: insertedId.toString(), questions });
  } catch (e: any) {
    console.error("survey/generate error", e);
    return NextResponse.json(
      { ok: false, error: e.message || "Failed to generate survey" },
      { status: 500 }
    );
  }
}
