// frontend/app/api/survey/qualitative/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  ...(process.env.OPENAI_PROJECT_ID ? { project: process.env.OPENAI_PROJECT_ID } : {}),
  ...(process.env.OPENAI_ORG_ID ? { organization: process.env.OPENAI_ORG_ID } : {}),
});

export async function POST(req: Request) {
  try {
    const { context } = await req.json().catch(() => ({ context: {} as any }));
    const ctx = typeof context === "string" ? context : JSON.stringify(context || {});

    // Build a single-string prompt for the Responses API
    const prompt = [
      "You are a survey designer for supply-chain businesses.",
      "Generate 2-3 short qualitative (open-ended) questions tailored to the respondent context below.",
      "Keep them crisp, unbiased, and actionable.",
      "Return each question on a new line. No numbering or bullets.",
      "",
      `Context JSON: ${ctx}`,
    ].join("\n");

    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    const r = await client.responses.create({
      model,
      input: prompt,            // <- string, not an array
      temperature: 0.3,
    });

    const text = (r.output_text || "").trim();
    const lines = text
      .split("\n")
      .map(s => s.replace(/^[\s*\-\•\d\.]+/, "").trim())
      .filter(Boolean)
      .slice(0, 3);

    const questions = lines.map((q, i) => ({
      id: `q_qual_${i + 1}_${Math.random().toString(36).slice(2, 8)}`,
      type: "short_text" as const,
      prompt: q,
    }));

    return NextResponse.json(
      { ok: true, questions },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: "qual_failed", detail: e?.message || String(e) },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
