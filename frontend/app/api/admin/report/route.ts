// frontend/app/api/admin/report/route.ts
import { NextResponse } from "next/server";
import { getDbOrNull } from "@/lib/mongo";

export async function GET() {
  try {
    const db = await getDbOrNull();
    if (!db) return NextResponse.json({ ok: false, error: "DB not connected" }, { status: 200 });

    const [counts, latestSubs, latestIntents, latestQuestions] = await Promise.all([
      db.collection("submissions").countDocuments({}),
      db.collection("submissions").find({}, { projection: { _id: 0 } }).sort({ createdAt: -1 }).limit(50).toArray(),
      db.collection("investor_intents").find({}, { projection: { _id: 0 } }).sort({ createdAt: -1 }).limit(50).toArray(),
      db.collection("investor_questions").find({}, { projection: { _id: 0 } }).sort({ createdAt: -1 }).limit(50).toArray(),
    ]);

    return NextResponse.json({
      ok: true,
      totals: { submissions: counts },
      latest: { submissions: latestSubs, investor_intents: latestIntents, investor_questions: latestQuestions },
      ts: new Date().toISOString(),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Unknown error" }, { status: 500 });
  }
}
