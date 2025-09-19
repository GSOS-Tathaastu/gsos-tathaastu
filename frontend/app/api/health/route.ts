// frontend/app/api/health/route.ts
import { NextResponse } from "next/server";
import { getDbOrNull } from "@/lib/mongo";

/**
 * This route never throws. It always returns { ok: true, ... } with
 * clear statuses and reasons so the Admin/Health page can render
 * even when env vars are missing or services are down.
 */

type Status = "ok" | "down" | "degraded" | "no_config";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const started = Date.now();

  // ---- API self health ----
  const api = {
    status: "ok" as Status,
    latencyMs: 0,
    node: process.version,
    vercel: !!process.env.VERCEL,
  };

  // ---- Mongo health ----
  const mongo = {
    status: "no_config" as Status,
    message: "MONGODB_URI not set",
  };

  // ---- Railway/backend health (optional) ----
  const backend = {
    status: "no_config" as Status,
    message: "NEXT_PUBLIC_BACKEND_URL not set",
  };

  // ---- Pages & APIs probes (optional; only if we know base URL) ----
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    getHeaderOrigin(req) ||
    null;

  const pages: Array<{ path: string; status: Status; latencyMs: number; error?: string }> = [];
  const apis: Array<{ path: string; status: Status; latencyMs: number; bodyShort?: string; error?: string }> = [];

  try {
    // Simulate light work to measure API latency
    await new Promise((r) => setTimeout(r, 0));
    api.latencyMs = Date.now() - started;
  } catch {
    api.status = "degraded";
  }

  // ---- Mongo check (only if MONGODB_URI present) ----
  try {
    if (process.env.MONGODB_URI) {
      const db = await getDbOrNull();
      if (db) {
        // trivial ping using serverStatus: avoids writes
        await db.command({ ping: 1 });
        mongo.status = "ok";
        mongo.message = "connected";
      } else {
        mongo.status = "down";
        mongo.message = "connection failed (getDbOrNull returned null)";
      }
    }
  } catch (e: any) {
    mongo.status = "down";
    mongo.message = e?.message || "mongo error";
  }

  // ---- Backend check (optional) ----
  try {
    const url = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (url) {
      backend.message = `ping ${url}`;
      const t0 = Date.now();
      const res = await fetch(`${url.replace(/\/$/, "")}/api/health`, { cache: "no-store" });
      const ms = Date.now() - t0;
      if (res.ok) {
        backend.status = "ok";
        backend.message = `${res.status} in ${ms}ms`;
      } else {
        backend.status = "down";
        backend.message = `HTTP ${res.status} in ${ms}ms`;
      }
    }
  } catch (e: any) {
    backend.status = "down";
    backend.message = e?.message || "backend fetch failed";
  }

  // ---- Optional page probes (only if baseUrl known) ----
  const pagePaths = ["/", "/how-it-works", "/modules", "/start", "/survey", "/contact", "/investors", "/admin/health"];
  if (baseUrl) {
    for (const p of pagePaths) {
      try {
        const t0 = Date.now();
        const res = await fetch(abs(baseUrl, p), { cache: "no-store" });
        pages.push({
          path: p,
          status: res.ok ? "ok" : "down",
          latencyMs: Date.now() - t0,
          error: res.ok ? undefined : `HTTP ${res.status}`,
        });
      } catch (e: any) {
        pages.push({ path: p, status: "down", latencyMs: 0, error: e?.message || "fetch failed" });
      }
    }
  }

  // ---- Optional API probes (only if baseUrl known) ----
  const apiPaths = ["/api/health", "/api/trade", "/api/admin/chunks/summary", "/api/survey/next"];
  if (baseUrl) {
    for (const p of apiPaths) {
      try {
        const t0 = Date.now();
        const res = await fetch(abs(baseUrl, p), { cache: "no-store" });
        const latency = Date.now() - t0;
        let bodyShort = "";
        try {
          const text = await res.text();
          bodyShort = text.slice(0, 160);
        } catch {
          bodyShort = "";
        }
        apis.push({
          path: p,
          status: res.ok ? "ok" : "down",
          latencyMs: latency,
          bodyShort: bodyShort || undefined,
          error: res.ok ? undefined : `HTTP ${res.status}`,
        });
      } catch (e: any) {
        apis.push({ path: p, status: "down", latencyMs: 0, error: e?.message || "fetch failed" });
      }
    }
  }

  // ---- Database counters (safe, optional) ----
  const counts: Record<string, number | string> = {
    companies: "—",
    submissions: "—",
    submissions7d: "—",
    surveySessions: "—",
    chunks: "—",
    investorIntents: "—",
    investorQuestions: "—",
    surveyDefLogs: "—",
  };

  try {
    const db = await getDbOrNull();
    if (db) {
      const names = await db.listCollections().toArray();
      const set = new Set(names.map((n: any) => n.name || n?.name));

      async function safeCount(name: string, filter: any = {}) {
        if (!set.has(name)) return 0;
        return await db.collection(name).countDocuments(filter);
      }

      counts.companies = await safeCount("companies");
      counts.submissions = await safeCount("submissions");
      counts.submissions7d = await safeCount("submissions", {
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      });
      counts.surveySessions = await safeCount("survey_sessions");
      counts.chunks = await safeCount("chunks");
      counts.investorIntents = await safeCount("investor_intents");
      counts.investorQuestions = await safeCount("investor_questions");
      counts.surveyDefLogs = await safeCount("survey_defs_logs");
    }
  } catch {
    // ignore — counters remain "—"
  }

  return NextResponse.json({
    ok: true,
    api,
    mongo,
    backend,
    baseUrl: baseUrl || null,
    pages,
    apis,
    counts,
    lastUpdated: new Date().toISOString(),
  });
}

/* helpers */
function abs(base: string, path: string) {
  return `${base.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}
function getHeaderOrigin(req: Request) {
  try {
    const url = new URL(req.url);
    const proto = (process as any).env.VERCEL ? "https" : url.protocol.replace(":", "");
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    return host ? `${proto}://${host}` : null;
  } catch {
    return null;
  }
}
