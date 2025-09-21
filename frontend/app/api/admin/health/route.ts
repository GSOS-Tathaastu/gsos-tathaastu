import { NextResponse } from "next/server";
import { getDbOrNull } from "@/lib/mongo";

export const runtime = "nodejs";

function baseFrom(req: Request) {
  const u = new URL(req.url);
  return `${u.protocol}//${u.host}`;
}

async function ping(url: string) {
  const t0 = Date.now();
  try {
    const res = await fetch(url, { cache: "no-store" });
    const latency = Date.now() - t0;
    const ok = res.ok;
    let body: any = null;
    let error: string | null = null;

    if (url.includes("/api/")) {
      try {
        body = await res.json();
      } catch {
        const text = await res.text();
        error = text.slice(0, 180);
      }
    }

    return { ok, latency, body, error: error || (ok ? null : res.statusText) };
  } catch (e: any) {
    return { ok: false, latency: Date.now() - t0, error: e?.message || "fetch_error" };
  }
}

export async function GET(req: Request) {
  const base = baseFrom(req);

  // --- service statuses ---
  let mongoStatus: "connected" | "down" = "down";
  let mongoError: string | null = null;
  try {
    const db = await getDbOrNull();
    if (db) mongoStatus = "connected";
  } catch (e: any) {
    mongoError = e?.message || "mongo_error";
  }

  const railwayStatus: "up" | "down" = process.env.RAILWAY_URL ? "up" : "down";

  // --- pages to ping (fast HEAD/GET) ---
  const pagesList = ["/", "/how-it-works", "/modules", "/start", "/survey", "/contact", "/investors", "/admin/health"];
  const pages = await Promise.all(
    pagesList.map(async (p) => {
      const r = await ping(`${base}${p}`);
      return { path: p, ok: r.ok, latency: r.latency, error: r.error || "" };
    })
  );

  // --- apis to ping ---
  const apisList = ["/api/health", "/api/survey/next", "/api/admin/chunks/summary"];
  const apis = await Promise.all(
    apisList.map(async (p) => {
      const r = await ping(`${base}${p}`);
      return {
        path: p,
        status: r.ok ? "OK" : "Down",
        latency: r.latency,
        error: r.error || "",
        body: r.body || null,
      };
    })
  );

  return NextResponse.json(
    {
      ok: true,
      mongo: { status: mongoStatus, error: mongoError },
      railway: { status: railwayStatus },
      pages,
      apis,
    },
    { status: 200 }
  );
}
