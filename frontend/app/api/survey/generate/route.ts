import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const role = url.searchParams.get("role") || "retailer";
  const count = url.searchParams.get("count") || "6";
  const seed = url.searchParams.get("seed") || "";

  const BACKEND_URL = process.env.BACKEND_URL!;
  const BACKEND_API_KEY = process.env.BACKEND_API_KEY || "";
  if (!BACKEND_URL) return NextResponse.json({ error: "BACKEND_URL not set" }, { status: 500 });

  const target = `${BACKEND_URL.replace(/\/$/,"")}/generate?role=${encodeURIComponent(role)}&count=${encodeURIComponent(count)}${seed?`&seed=${seed}`:""}`;

  const rsp = await fetch(target, { headers: { "x-api-key": BACKEND_API_KEY }, cache: "no-store" });

  if (!rsp.ok) {
    const txt = await rsp.text();
    return NextResponse.json({ error: "proxy_failed", details: txt }, { status: 502 });
  }
  const data = await rsp.json();
  return NextResponse.json(data);
}
