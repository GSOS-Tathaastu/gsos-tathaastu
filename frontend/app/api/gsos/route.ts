// frontend/app/api/gsos/route.ts
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL!;
const BACKEND_API_KEY = process.env.BACKEND_API_KEY!;

// We’ll keep this on the Node runtime for max compatibility.
export const runtime = "nodejs";

function backendUrl(path: string, search?: string) {
  const base = BACKEND_URL.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}${search ? (search.startsWith("?") ? search : `?${search}`) : ""}`;
}

async function proxy(req: NextRequest, path: string) {
  const url = new URL(req.url);
  const search = url.search; // includes ?...
  const target = backendUrl(path, search);

  const init: RequestInit = {
    method: req.method,
    headers: {
      "x-api-key": BACKEND_API_KEY,
      // Forward content-type only; avoid passing host/cookies to backend
      ...(req.headers.get("content-type") ? { "content-type": req.headers.get("content-type")! } : {}),
    },
    body: req.method !== "GET" && req.method !== "HEAD" ? await req.text() : undefined,
    cache: "no-store",
  };

  const r = await fetch(target, init);
  const text = await r.text();
  return new NextResponse(text, {
    status: r.status,
    headers: {
      "content-type": r.headers.get("content-type") ?? "application/json",
      "cache-control": "no-store",
    },
  });
}

export async function GET(req: NextRequest) {
  // /api/gsos?path=generate&role=retailer&count=3
  const path = (new URL(req.url)).searchParams.get("path") || "";
  if (path === "generate") return proxy(req, "/generate");
  if (path === "index-meta") return proxy(req, "/admin/index-meta"); // handy for checks
  return NextResponse.json({ error: "unknown_path" }, { status: 400 });
}

export async function POST(req: NextRequest) {
  // /api/gsos?path=ask
  const path = (new URL(req.url)).searchParams.get("path") || "";
  if (path === "ask") return proxy(req, "/ask");
  if (path === "reingest") return proxy(req, "/admin/reingest"); // optional tooling
  return NextResponse.json({ error: "unknown_path" }, { status: 400 });
}
