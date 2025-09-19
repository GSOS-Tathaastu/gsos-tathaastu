// frontend/app/api/admin/metrics/route.ts
import { NextResponse } from "next/server";
import { getDbOrNull } from "@/lib/mongo";

export async function GET() {
  const started = Date.now();
  const db = await getDbOrNull();

  const counts = {
    chunks: 0, companies: 0, investor_intents: 0, investor_questions: 0,
    submissions: 0, survey_defs_logs: 0, survey_sessions: 0
  };
  const collections: { name: string; count: number }[] = [];
  let dbStats: any = null;

  if (!db) {
    return NextResponse.json({
      ok: false, error: "Database connection not available (set MONGO_URI & MONGO_DB)",
      counts, collections, dbStats,
      runtime: { node: process.version, vercel: !!process.env.VERCEL },
      latencyMs: Date.now() - started, ts: new Date().toISOString(),
    });
  }

  try {
    const colls = await db.listCollections().toArray();
    const names = new Set(colls.map((c) => c.name));
    const safeCount = async (n: string) => (names.has(n) ? db.collection(n).countDocuments({}) : 0);

    counts.chunks = await safeCount("chunks");
    counts.companies = await safeCount("companies");
    counts.investor_intents = await safeCount("investor_intents");
    counts.investor_questions = await safeCount("investor_questions");
    counts.submissions = await safeCount("submissions");
    counts.survey_defs_logs = await safeCount("survey_defs_logs");
    counts.survey_sessions = await safeCount("survey_sessions");

    for (const n of Array.from(names).slice(0, 12)) {
      const c = await db.collection(n).estimatedDocumentCount();
      collections.push({ name: n, count: c });
    }

    dbStats = await db.command({ dbStats: 1 }).catch(() => null);

    let last7 = 0;
    if (names.has("submissions")) {
      last7 = await db.collection("submissions").countDocuments({ createdAt: { $gte: new Date(Date.now() - 7 * 86400000) } });
    }

    return NextResponse.json({
      ok: true, counts, collections, dbStats, extra: { submissions_last_7d: last7 },
      runtime: { node: process.version, vercel: !!process.env.VERCEL },
      latencyMs: Date.now() - started, ts: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({
      ok: false, error: err?.message || "Unknown error",
      counts, collections, dbStats, runtime: { node: process.version, vercel: !!process.env.VERCEL },
      latencyMs: Date.now() - started, ts: new Date().toISOString(),
    }, { status: 200 });
  }
}
