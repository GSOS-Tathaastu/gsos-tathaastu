import { NextResponse } from "next/server";
import { getDbOrNull } from "@/lib/mongo";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const range = url.searchParams.get("range") || "total"; // "day" | "month" | "total"

  const db = await getDbOrNull();
  if (!db) return NextResponse.json({ ok: false, error: "db_down" }, { status: 200 });

  const col = db.collection("ai_usage");

  const toISODate = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const now = new Date();

  let match: any = {};
  if (range === "day") {
    const start = toISODate(now);
    match = { ts: { $gte: start } };
  } else if (range === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    match = { ts: { $gte: start } };
  }

  const pipeline = [
    { $match: match },
    {
      $group: {
        _id: null,
        calls: { $sum: 1 },
        prompt_tokens: { $sum: { $ifNull: ["$prompt_tokens", 0] } },
        completion_tokens: { $sum: { $ifNull: ["$completion_tokens", 0] } },
        total_tokens: { $sum: { $ifNull: ["$total_tokens", 0] } },
      },
    },
  ];

  const agg = await col.aggregate(pipeline).toArray();
  const row = agg[0] || { calls: 0, prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

  return NextResponse.json({ ok: true, range, ...row }, { status: 200 });
}
