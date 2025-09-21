import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const key = process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ALT;
  if (!key) {
    return NextResponse.json({ ok: false, error: "OPENAI_API_KEY not set" }, { status: 200 });
  }

  try {
    const r = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${key}` },
      cache: "no-store",
    });
    if (!r.ok) {
      const txt = await r.text();
      return NextResponse.json({ ok: false, error: txt.slice(0, 300) }, { status: 200 });
    }
    const j = await r.json();
    return NextResponse.json({ ok: true, modelCount: j?.data?.length ?? 0 }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "openai_failed" }, { status: 200 });
  }
}
