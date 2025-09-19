import { NextResponse } from "next/server";

export async function GET() {
  const BACKEND = (process.env.BACKEND_URL || "").replace(/\/+$/, "");
  let upstream: any = null;
  let ok = false;
  try {
    if (BACKEND) {
      const r = await fetch(`${BACKEND}/health`, { cache: "no-store" });
      const t = await r.text();
      upstream = { status: r.status, text: t };
      ok = r.ok;
    }
  } catch (e: any) {
    upstream = { error: String(e?.message || e) };
  }
  return NextResponse.json({ ok, BACKEND_URL: BACKEND, upstream });
}