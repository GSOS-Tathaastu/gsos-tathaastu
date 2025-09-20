// frontend/app/api/admin/deals/summary/route.ts
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getDbOrNull } from "@/lib/mongo";
import { loadExternalDeals } from "@/lib/benchmarks";

/**
 * We cache last fetch times & sample counts in-memory to avoid hammering external APIs.
 * This resets on each server restart (OK for admin).
 */
type DealsCache = {
  lastFetchLocal?: string | null;
  lastFetchDb?: string | null;
  lastFetchExternal?: string | null;
  lastExternalQuery?: string | null;
  lastExternalCount?: number | null;
};

const g = globalThis as any;
if (!g.__DEALS_SUMMARY_CACHE__) g.__DEALS_SUMMARY_CACHE__ = {} as DealsCache;
const CACHE: DealsCache = g.__DEALS_SUMMARY_CACHE__;

/** Count local JSON deals under /data/*.json */
function countLocalDeals(): number {
  const folder = path.join(process.cwd(), "data");
  if (!fs.existsSync(folder)) {
    CACHE.lastFetchLocal = new Date().toISOString();
    return 0;
  }
  const files = fs.readdirSync(folder).filter((f) => f.toLowerCase().endsWith(".json"));
  let count = 0;
  for (const f of files) {
    try {
      const raw = fs.readFileSync(path.join(folder, f), "utf8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) count += parsed.length;
      else if (parsed && typeof parsed === "object") count += 1;
    } catch {
      // ignore malformed
    }
  }
  CACHE.lastFetchLocal = new Date().toISOString();
  return count;
}

/** Count DB deals in collection "deals" if available */
async function countDbDeals(): Promise<{ count: number; ok: boolean; note?: string }> {
  const db = await getDbOrNull();
  if (!db) {
    CACHE.lastFetchDb = new Date().toISOString();
    return { count: 0, ok: false, note: "DB not connected" };
  }
  try {
    const names = (await db.listCollections().toArray()).map((c) => c.name);
    if (!names.includes("deals")) {
      CACHE.lastFetchDb = new Date().toISOString();
      return { count: 0, ok: true, note: "No 'deals' collection" };
    }
    const c = await db.collection("deals").estimatedDocumentCount();
    CACHE.lastFetchDb = new Date().toISOString();
    return { count: c, ok: true };
  } catch (e: any) {
    CACHE.lastFetchDb = new Date().toISOString();
    return { count: 0, ok: false, note: e?.message || "failed to count" };
  }
}

/**
 * Optionally count “external” deals by making a light query.
 * Only runs when:
 *  - EXTERNAL_DEALS_ENABLED=1
 *  - refresh=1 is passed (to avoid API quotas during normal page loads)
 */
async function countExternalDeals(refresh: boolean): Promise<{ enabled: boolean; count: number | null; note?: string }> {
  const enabled = process.env.EXTERNAL_DEALS_ENABLED === "1";
  if (!enabled) {
    return { enabled, count: null, note: "External disabled" };
  }

  if (!refresh) {
    return {
      enabled,
      count: CACHE.lastExternalCount ?? null,
      note: CACHE.lastExternalQuery ? `cached: ${CACHE.lastExternalQuery}` : "no recent fetch",
    };
  }

  // Make a very general query; admin can refine later if needed
  const q = "pre-seed seed fintech logistics trade investment round";
  try {
    const limit = Number(process.env.EXTERNAL_DEALS_LIMIT || 20);
    const deals = await loadExternalDeals(q, limit);
    CACHE.lastExternalQuery = q;
    CACHE.lastExternalCount = deals.length;
    CACHE.lastFetchExternal = new Date().toISOString();
    return { enabled, count: deals.length, note: `fetched '${q}' (limit ${limit})` };
  } catch (e: any) {
    CACHE.lastFetchExternal = new Date().toISOString();
    return { enabled, count: null, note: e?.message || "external fetch failed" };
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const refresh = url.searchParams.get("refresh") === "1";

  const started = Date.now();
  const localCount = countLocalDeals();
  const dbInfo = await countDbDeals();
  const extInfo = await countExternalDeals(refresh);

  const payload = {
    ok: true,
    latencyMs: Date.now() - started,
    sources: {
      local: {
        count: localCount,
        lastFetch: CACHE.lastFetchLocal ?? null,
      },
      db: {
        ok: dbInfo.ok,
        count: dbInfo.count,
        note: dbInfo.note || null,
        lastFetch: CACHE.lastFetchDb ?? null,
      },
      external: {
        enabled: extInfo.enabled,
        count: extInfo.count,            // null if not refreshed or disabled
        note: extInfo.note || null,
        lastFetch: CACHE.lastFetchExternal ?? null,
      },
    },
  };

  return NextResponse.json(payload, { status: 200 });
}
