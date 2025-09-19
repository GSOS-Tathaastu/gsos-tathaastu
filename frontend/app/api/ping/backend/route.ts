// frontend/app/api/ping/backend/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const started = Date.now();
  const url = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!url) {
    return NextResponse.json(
      { ok: false, error: "NEXT_PUBLIC_BACKEND_URL not set" },
      { status: 200 }
    );
  }

  try {
    const res = await fetch(`${url.replace(/\/$/, "")}/health`, {
      headers: {
        "x-api-key": process.env.NEXT_PUBLIC_BACKEND_API_KEY || "",
      },
      cache: "no-store",
    });

    const text = await res.text();
    let body: any = text;
    try {
      body = JSON.parse(text);
    } catch {
      // keep text as-is
    }

    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      latencyMs: Date.now() - started,
      body,
    });
  } catch (e: any) {
    return NextResponse.json({
      ok: false,
      error: e?.message || "fetch failed",
      latencyMs: Date.now() - started,
    });
  }
}
