// frontend/app/api/admin/metrics/route.ts
import { NextResponse } from "next/server";
import { getDbOrNull } from "@/lib/mongo";

export async function GET() {
  const started = Date.now();
  const db = await getDbOrNull();

  // Defaults
  const counts = { submissions: 0, users: 0, chunks: 0 };
  const collections: { name: string; count: number }[] = [];
  let dbStats: any = null;

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
    const names = colls.map((c) => c.name);

    async function safeCount(name: string) {
      if (!names.includes(name)) return 0;
      return await db.collection(name).countDocuments({});
    }

    counts.submissions = await safeCount("submissions");
    counts.users = await safeCount("users");
    counts.chunks = await safeCount("chunks");

    // top few collections
    for (const n of names.slice(0, 12)) {
      const c = await db.collection(n).estimatedDocumentCount();
      collections.push({ name: n, count: c });
    }

    dbStats = await db.command({ dbStats: 1, scale: 1 }).catch(() => null);

    return NextResponse.json({
      ok: true,
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
