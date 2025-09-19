import { NextResponse } from "next/server";
import { getDbOrNull } from "@/lib/mongo";
import { PAGE_CHECKS, API_CHECKS } from "@/lib/healthConfig";

async function headOrGet(url: string) {
  const t0 = Date.now();
  try {
    // Try HEAD first (fast); some routes may 405, then we fallback to GET.
    let res = await fetch(url, { method: "HEAD", cache: "no-store" });
    if (res.status === 405 || res.status === 501) {
      res = await fetch(url, { method: "GET", cache: "no-store" });
    }
    return { ok: res.ok, status: res.status, latencyMs: Date.now() - t0 };
  } catch (e: any) {
    return { ok: false, status: 0, latencyMs: Date.now() - t0, error: e?.message || "request failed" };
  }
}

async function get(url: string) {
  const t0 = Date.now();
  try {
    const res = await fetch(url, { cache: "no-store" });
    const text = await res.text();
    let body: any = text;
    try { body = JSON.parse(text); } catch {}
    return { ok: res.ok, status: res.status, latencyMs: Date.now() - t0, body };
  } catch (e: any) {
    return { ok: false, status: 0, latencyMs: Date.now() - t0, error: e?.message || "GET failed" };
  }
}

export async function GET(req: Request) {
  const started = Date.now();
  const origin = new URL(req.url).origin;

  // Mongo check
  let mongo = { ok: false, message: "not configured" as string };
  try {
    const db = await getDbOrNull();
    if (db) {
      await db.command({ ping: 1 });
      mongo = { ok: true, message: "connected" };
    }
  } catch (e: any) {
    mongo = { ok: false, message: e?.message || "mongo error" };
  }

  // Pages & APIs
  const pages = await Promise.all(PAGE_CHECKS.map(async (p) => ({ path: p, ...(await headOrGet(origin + p)) })));
  const apis  = await Promise.all(API_CHECKS.map(async (p) => ({ path: p, ...(await get(origin + p)) })));

  // External backend (optional)
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  let backend: any = { ok: false, error: "NEXT_PUBLIC_BACKEND_URL not set" };
  if (backendUrl) backend = await get(`${backendUrl.replace(/\/$/, "")}/health`);

  return NextResponse.json({
    status: mongo.ok ? "ok" : "degraded",
    latencyMs: Date.now() - started,
    checks: {
      nextApi: { ok: true, message: "Next.js API responding" },
      mongo,
      pages,
      apis,
      backend,
    },
    envPresence: {
      MONGO_URI: !!process.env.MONGO_URI,
      MONGO_DB: !!process.env.MONGO_DB,
      BACKEND_URL: !!process.env.NEXT_PUBLIC_BACKEND_URL,
      BACKEND_API_KEY: !!process.env.NEXT_PUBLIC_BACKEND_API_KEY,
      OPENAI: !!process.env.OPENAI_API_KEY,
    },
    runtime: { node: process.version, vercel: !!process.env.VERCEL },
    ts: new Date().toISOString(),
  });
}
