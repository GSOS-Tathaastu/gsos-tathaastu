import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";

export async function GET() {
  try {
    const db = await getDb();
    const surveys = db.collection("survey_submissions"); // if you use a different collection, adjust
    const total = await surveys.countDocuments();

    // Very light-weight signals (adjust as your schema evolves)
    const last = await surveys.find({}).sort({ createdAt: -1 }).limit(1).toArray();
    const lastUpdated = last?.[0]?.createdAt || null;

    // Example: basic keyword counts from a 'pain' free-text field
    const cursor = surveys.find({}, { projection: { pain: 1 } });
    const keywords: Record<string, number> = {};
    for await (const doc of cursor) {
      const text = (doc?.pain || "").toLowerCase();
      ["stockout", "overstock", "delay", "compliance", "cash", "forecast"].forEach((k) => {
        if (text.includes(k)) keywords[k] = (keywords[k] || 0) + 1;
      });
    }

    // Example likert averages if you store normalized likert answers as { qid, value }
    const likertAgg = await surveys.aggregate([
      { $unwind: { path: "$likert", preserveNullAndEmptyArrays: true } },
      { $match: { "likert.value": { $gte: 1, $lte: 5 } } },
      {
        $group: {
          _id: "$likert.qid",
          avg: { $avg: "$likert.value" },
          n: { $sum: 1 },
        },
      },
      { $sort: { avg: -1 } },
      { $limit: 10 },
    ]).toArray();

    return NextResponse.json({
      ok: true,
      ready: total >= 30,
      total,
      lastUpdated,
      painKeywords: keywords,
      likert: likertAgg,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "failed" }, { status: 500 });
  }
}
