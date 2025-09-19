// frontend/app/api/investors/analytics/route.ts
import clientPromise from "@/lib/mongo";
import { NextResponse } from "next/server";

const DB = process.env.MONGODB_DB || "gsos";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(DB);

    const totalSurveys = await db.collection("survey_responses").countDocuments({});
    const last = await db.collection("survey_responses")
      .find({}, { projection: { _id: 0, createdAt: 1 } })
      .sort({ createdAt: -1 }).limit(1).next();

    const ready = totalSurveys >= 30;

    // Build numeric stats (example for Likert-like answers where answers[].type === "likert")
    let numericStats: Record<string, { avg: number; count: number }> = {};
    if (ready) {
      const cursor = db.collection("survey_responses").aggregate([
        { $unwind: "$answers" },
        { $match: { "answers.type": "likert", "answers.value": { $type: "number" } } },
        { $group: { _id: "$answers.qid", avg: { $avg: "$answers.value" }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 },
      ]);
      const rows = await cursor.toArray();
      numericStats = Object.fromEntries(rows.map(r => [r._id, { avg: r.avg, count: r.count }]));
    }

    // Short-answer “top” (free text pain signals), using simple keyword bucketing
    let top: { text: string; count: number }[] = [];
    let summary = "";
    if (ready) {
      const pains = await db.collection("survey_responses").aggregate([
        { $unwind: "$answers" },
        { $match: { "answers.type": "short_text" } },
        {
          $project: {
            k: {
              $trim: {
                input: {
                  $replaceAll: {
                    input: { $toLower: "$answers.value" },
                    find: /[^\w\s]/g, replacement: ""
                  } as any
                }
              }
            }
          }
        },
        { $group: { _id: "$k", n: { $sum: 1 } } },
        { $sort: { n: -1 } },
        { $limit: 10 },
      ]).toArray();

      top = pains.filter(p => p._id && p._id.length > 1).map(p => ({ text: p._id, count: p.n }));

      // Lightweight textual summary:
      summary = [
        `Sample size: ${totalSurveys}.`,
        top.length ? `Common pain points: ${top.slice(0,5).map(t=>t.text).join(", ")}.` : "",
        `Top maturity gaps visible in Likert averages.`,
      ].filter(Boolean).join(" ");
    }

    return NextResponse.json({
      totalSurveys,
      lastUpdated: last?.createdAt || null,
      ready,
      summary,
      top,
      numericStats,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (e: any) {
    return NextResponse.json({ error: "analytics_failed", detail: e.message }, { status: 500 });
  }
}
