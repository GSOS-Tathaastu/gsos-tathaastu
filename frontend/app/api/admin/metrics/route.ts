// frontend/app/api/admin/metrics/route.ts
import { NextResponse } from "next/server";
import { getDbOrNull } from "@/lib/mongo";

type CountMap = {
  chunks: number;
  companies: number;
  investor_intents: number;
  investor_questions: number;
  submissions: number;
  survey_defs_logs: number;
  survey_sessions: number;
};

export async function GET() {
  const started = Date.now();
  const db = await getDbOrNull();

  const counts: CountMap = {
    chunks: 0,
    companies: 0,
    investor_intents: 0,
    investor_questions: 0,
    submissions: 0,
    survey_defs_logs: 0,
    survey_sessions: 0,
  };
  const collections: { name: string; count: number }[] = [];
  let dbStats: any = null;

  // Graceful response if DB not available
  if (!db) {
    return NextResponse.json({
      ok: false,
      error: "Database connection not available (set MONGO_URI & MONGO_DB)",
      counts,
      collections,
      dbStats,
      runtime: {
        node: process.version,
        vercel: !!process.env.VERCEL,
        uptimeSec: Math.round(process.uptime()),
        pid: process.pid,
      },
      latencyMs: Date.now() - started,
      ts: new Date().toISOString(),
    });
  }

  try {
    const colls = await db.listCollections().toArray();
    const names = new Set(colls.map((c) => c.name));

    const safeCount = async (name: keyof CountMap) => {
      if (!names.has(name)) return 0;
      return await db.collection(name).countDocuments({});
    };

    // Fill per your screenshot
    counts.chunks = await safeCount("chunks");
    counts.companies = await safeCount("companies");
    counts.investor_intents = await safeCount("investor_intents");
    counts.investor_questions = await safeCount("investor_questions");
    counts.submissions = await safeCount("submissions");
    counts.survey_defs_logs = await safeCount("survey_defs_logs");
    counts.survey_sessions = await safeCount("survey_sessions");

    // Show top 12 collections & counts
    for (const n of Array.from(names).slice(0, 12)) {
      const c = await db.collection(n).estimatedDocumentCount();
      collections.push({ name: n, count: c });
    }

    // DB stats (optional)
    dbStats = await db.command({ dbStats: 1, scale: 1 }).catch(() => null);

    // (Optional) quick “last week” submissions metric if createdAt exists
    let last7Days = 0;
    if (names.has("submissions")) {
      last7Days = await db.collection("submissions").countDocuments({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      });
    }

    return NextResponse.json({
      ok: true,
      counts,
      collections,
      dbStats,
      extra: { submissions_last_7d: last7Days },
      runtime: {
        node: process.version,
        vercel: !!process.env.VERCEL,
        uptimeSec: Math.round(process.uptime()),
        pid: process.pid,
      },
      latencyMs: Date.now() - started,
      ts: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "Unknown error",
        counts,
        collections,
        dbStats,
        runtime: {
          node: process.version,
          vercel: !!process.env.VERCEL,
          uptimeSec: Math.round(process.uptime()),
          pid: process.pid,
        },
        latencyMs: Date.now() - started,
        ts: new Date().toISOString(),
      },
      { status: 200 }
    );
  }
}
