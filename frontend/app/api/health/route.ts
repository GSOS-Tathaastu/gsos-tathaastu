// frontend/app/api/health/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getDbOrNull } from "@/lib/mongo";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const started = Date.now();
  const out: any = {
    next: { ok: true, latencyMs: 0, node: process.version, vercel: !!process.env.VERCEL },
    mongo: { status: "unknown", error: null },
    railway: { status: "unknown", note: process.env.NEXT_PUBLIC_BACKEND_URL ? "configured" : "NEXT_PUBLIC_BACKEND_URL not set" },
    pages: [],
    apis: [],
    metrics: {
      companies: 0,
      submissions: 0,
      submissions7d: 0,
      sessions: 0,
      chunks: 0,
      investorIntents: 0,
      investorQuestions: 0,
      surveyDefLogs: 0,
    },
    updatedAt: new Date().toISOString(),
  };

  // Mongo
  try {
    const db = await getDbOrNull();
    if (!db) {
      out.mongo = { status: "down", error: "no_db" };
    } else {
      out.mongo.status = "connected";

      const names = (await db.listCollections().toArray()).map((c: any) => c.name);
      const safeCount = async (name: string) => (names.includes(name) ? await db.collection(name).countDocuments({}) : 0);

      out.metrics.companies = await safeCount("companies");
      out.metrics.submissions = await safeCount("submissions");
      out.metrics.sessions = await safeCount("survey_sessions");
      out.metrics.chunks = await safeCount("chunks");
      out.metrics.investorIntents = await safeCount("investor_intents");
      out.metrics.investorQuestions = await safeCount("investor_questions");
      out.metrics.surveyDefLogs = await safeCount("survey_defs_logs");

      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      out.metrics.submissions7d = names.includes("submissions")
        ? await db.collection("submissions").countDocuments({ createdAt: { $gte: sevenDaysAgo } })
        : 0;
    }
  } catch (e: any) {
    out.mongo = { status: "down", error: e?.message || "mongo_error" };
  }

  // Pages quick ping (relative to this origin)
  const origin = req.nextUrl.origin;
  const pagePaths = ["/", "/how-it-works", "/modules", "/start", "/survey", "/contact", "/investors", "/admin/health"];
  for (const p of pagePaths) {
    try {
      const r = await fetch(origin + p, { method: "HEAD", cache: "no-store" });
      out.pages.push({ path: p, status: r.ok ? "OK" : "ERR", latency: 0, error: r.ok ? "" : `HTTP ${r.status}` });
    } catch (e: any) {
      out.pages.push({ path: p, status: "ERR", latency: 0, error: e?.message || "fetch_failed" });
    }
  }

  // APIs sample
  const apiPaths = ["/api/health", "/api/survey/next", "/api/admin/chunks/summary"];
  for (const p of apiPaths) {
    try {
      const t0 = Date.now();
      const r = await fetch(origin + p, { method: "GET", cache: "no-store" });
      const text = await r.text();
      out.apis.push({
        path: p,
        status: r.ok ? "OK" : "ERR",
        latency: Date.now() - t0,
        bodyShort: (text || "").slice(0, 120),
      });
    } catch (e: any) {
      out.apis.push({ path: p, status: "ERR", latency: 0, bodyShort: e?.message || "fetch_failed" });
    }
  }

  out.next.latencyMs = Date.now() - started;
  return NextResponse.json(out, { headers: { "Cache-Control": "no-store" } });
}
