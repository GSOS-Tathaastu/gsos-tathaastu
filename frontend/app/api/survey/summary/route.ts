import { NextResponse } from "next/server";
import { getDbOrNull } from "@/lib/mongo";

/**
 * Returns high-level analytics for investor view.
 * Collection is assumed to be "survey_sessions".
 * Works without DB by returning a tiny fallback demo.
 */

export const runtime = "nodejs";

export async function GET() {
  try {
    const db = await getDbOrNull();

    if (!db) {
      return NextResponse.json(
        {
          ok: true,
          totals: { sessions: 12, countries: 4, avgLikert: 3.8 },
          byCountry: [
            { country: "India", count: 5 },
            { country: "USA", count: 3 },
            { country: "Germany", count: 2 },
            { country: "Singapore", count: 2 },
          ],
          topQuestions: [
            { id: "q1", prompt: "What’s your primary export market?", responses: 10 },
            { id: "q2", prompt: "How do you finance working capital?", responses: 9 },
          ],
          recent: [
            { email: "a***@example.com", country: "India", startedAt: new Date().toISOString() },
            { email: "b***@example.com", country: "USA", startedAt: new Date(Date.now()-86400000).toISOString() },
          ],
          fallback: true,
        },
        { status: 200 }
      );
    }

    const coll = db.collection("survey_sessions");

    // Totals
    const sessions = await coll.countDocuments({});
    const countriesAgg = await coll
      .aggregate([
        { $group: { _id: { $ifNull: ["$country", "Unknown"] }, count: { $sum: 1 } } },
        { $project: { country: "$_id", count: 1, _id: 0 } },
        { $sort: { count: -1 } },
        { $limit: 50 },
      ])
      .toArray();

    // Avg likert across any likert answers if present
    const likertAgg = await coll
      .aggregate([
        { $unwind: "$answers" },
        {
          $match: {
            "answers.value": { $type: "number" },
          },
        },
        { $group: { _id: null, avg: { $avg: "$answers.value" } } },
      ])
      .toArray();
    const avgLikert = likertAgg?.[0]?.avg ?? null;

    // Top answered questions (by answers count)
    const topQ = await coll
      .aggregate([
        { $unwind: "$answers" },
        {
          $group: {
            _id: "$answers.qid",
            responses: { $sum: 1 },
          },
        },
        { $sort: { responses: -1 } },
        { $limit: 10 },
        // Look up prompt text from questions array
      ])
      .toArray();

    // Try to enrich prompts from embedded questions if they exist
    const promptsMap: Record<string, string> = {};
    const sample = await coll.findOne({}, { projection: { questions: 1 } });
    if (sample?.questions?.length) {
      for (const q of sample.questions as any[]) {
        promptsMap[q.id] = q.prompt;
      }
    }

    const topQuestions = topQ.map((q) => ({
      id: q._id as string,
      prompt: promptsMap[q._id as string] || q._id,
      responses: q.responses as number,
    }));

    // Recent sessions
    const recent = await coll
      .find({}, { projection: { email: 1, country: 1, startedAt: 1 } })
      .sort({ startedAt: -1 })
      .limit(12)
      .toArray();

    return NextResponse.json(
      {
        ok: true,
        totals: {
          sessions,
          countries: countriesAgg.length,
          avgLikert: avgLikert,
        },
        byCountry: countriesAgg,
        topQuestions,
        recent: recent.map((r: any) => ({
          email: r.email,
          country: r.country,
          startedAt: r.startedAt,
        })),
      },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "summary_failed" },
      { status: 500 }
    );
  }
}
