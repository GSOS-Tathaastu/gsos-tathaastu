// frontend/app/api/gsos/route.ts
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL;           // e.g. https://gsos-tathaastu-production.up.railway.app
const BACKEND_API_KEY = process.env.BACKEND_API_KEY;   // same key you use with curl (x-api-key)

function missing(msg: string) {
  return NextResponse.json({ error: msg }, { status: 400 });
}

export async function GET(req: NextRequest) {
  if (!BACKEND_URL || !BACKEND_API_KEY) {
    return missing("BACKEND_URL or BACKEND_API_KEY not configured");
  }
  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path");

  if (path === "generate") {
    // /generate?role=...&count=...
    const role = searchParams.get("role") || "retailer";
    const count = searchParams.get("count") || "12";
    const url = `${BACKEND_URL}/generate?role=${encodeURIComponent(role)}&count=${encodeURIComponent(count)}`;
    const res = await fetch(url, {
      headers: { "x-api-key": BACKEND_API_KEY },
      cache: "no-store",
    });
    const body = await res.text();
    return new NextResponse(body, { status: res.status, headers: { "content-type": res.headers.get("content-type") || "application/json" } });
  }

  return missing("unknown GET path");
}

export async function POST(req: NextRequest) {
  if (!BACKEND_URL || !BACKEND_API_KEY) {
    return missing("BACKEND_URL or BACKEND_API_KEY not configured");
  }
  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path");
  const json = await req.json().catch(() => null);

  if (!json) return missing("invalid JSON body");

  if (path === "ask") {
    const url = `${BACKEND_URL}/ask`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "x-api-key": BACKEND_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify(json),
    });
    const body = await res.text();
    return new NextResponse(body, { status: res.status, headers: { "content-type": res.headers.get("content-type") || "application/json" } });
  }

  if (path === "analyze") {
    const url = `${BACKEND_URL}/analyze`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "x-api-key": BACKEND_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify(json), // { role, answers }
    });
    const body = await res.text();
    return new NextResponse(body, { status: res.status, headers: { "content-type": res.headers.get("content-type") || "application/json" } });
  }

  return missing("unknown POST path");
}
