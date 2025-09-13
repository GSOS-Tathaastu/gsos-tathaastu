// app/api/gsos/route.ts
import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.API_BASE!;
const KEY  = process.env.BACKEND_API_KEY!;

export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get("path") || "";
  if (!path) return NextResponse.json({ ok:false, error:"Missing path" }, { status: 400 });

  const url = `${BASE}/${path}${req.nextUrl.search ? req.nextUrl.search : ""}`;
  const r = await fetch(url, { headers: { "x-api-key": KEY } });
  const text = await r.text();
  return new NextResponse(text, { status: r.status });
}

export async function POST(req: NextRequest) {
  const urlObj = new URL(req.url);
  const path = urlObj.searchParams.get("path") || "";
  if (!path) return NextResponse.json({ ok:false, error:"Missing path" }, { status: 400 });

  const body = await req.text();
  const url = `${BASE}/${path}${urlObj.search ? urlObj.search : ""}`;
  const r = await fetch(url, {
    method: "POST",
    headers: { "x-api-key": KEY, "content-type": "application/json" },
    body,
  });
  const text = await r.text();
  return new NextResponse(text, { status: r.status });
}
