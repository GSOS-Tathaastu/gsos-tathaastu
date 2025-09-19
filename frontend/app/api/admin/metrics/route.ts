import { NextResponse } from "next/server";
import { getDbOrNull } from "@/lib/mongo";

export async function GET() {
  const started = Date.now();
  const db = await getDbOrNull();

  let stats: any = null;
  let collections: { name: string; count: number }[] = [];
  let counts: Record<string, number> = {
    submissions: 0,
    companies: 0,
    chunks: 0, // if you have embeddings/chunking pipeline, this will show up
  };

  if (db) {
    try {
      // DB stats
      stats = await db.command({ dbStats: 1, scale: 1 }).catch(() => null);

      // Collection counts (defensive—only count if collection exists)
      const colls = await db.listCollections().toArray();
      const names = colls.map(c => c.name);

      async function safeCount(name: string) {
        if (!names.includes(name)) return 0;
        return await db.collection(name).countDocuments({});
      }

      counts.submissions = await safeCount("submissions");
      counts.companies   = await safeCount("companies");
      counts.chunks      = await safeCount("chunks");

      // also list first few collections with sizes
      for (const n of names.slice(0, 12)) {
        const c = await db.collection(n).estimatedDocumentCount();
        collections.push({ name: n, count: c });
      }
    } catch {}
  }

  // Node process metrics (server runtime)
  const mem = process.memoryUsage();
  const memory = {
    rssMB: Math.round(mem.rss / 1024 / 1024),
    heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
    heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
    externalMB: Math.round(mem.external / 1024 / 1024),
  };

  return NextResponse.json({
    ok: true,
    latencyMs: Date.now() - started,
    hasDb: !!db,
    counts,
    collections,
    dbStats: stats,
    runtime: {
      node: process.version,
      vercel: !!process.env.VERCEL,
      uptimeSec: Math.round(process.uptime()),
      pid: process.pid,
    },
    ts: new Date().toISOString(),
  });
}
