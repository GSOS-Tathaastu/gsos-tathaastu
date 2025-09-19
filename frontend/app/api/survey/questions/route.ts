// frontend/app/api/survey/questions/route.ts
import { NextResponse } from "next/server";
import { getSurvey } from "@/lib/questionBank";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role") || "retailer";
  const country = searchParams.get("country") || "India";

  const def = getSurvey(role, country);
  return NextResponse.json(def);
}
