// frontend/app/api/survey/questions/route.ts
import { NextResponse } from "next/server";
import { getSurvey } from "@/lib/questionBank";
import { getDbOrNull } from "@/lib/mongo";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role") || "retailer";
  const country = searchParams.get("country") || "India";

  const def = getSurvey(role, country);

  // Optional: log each generation so Admin can see volume per role/country
  try {
    const db = await getDbOrNull();
    if (db) {
      await db.collection("survey_defs_logs").insertOne({
        role, country,
        questionsCount: def.questions.length,
        generatedAt: new Date()
      });
    }
  } catch {
    // ignore logging errors
  }

  return NextResponse.json(def);
}
