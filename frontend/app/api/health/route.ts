import { NextResponse } from "next/server";
import { getDbOrNull } from "@/lib/mongo";

export const runtime = "nodejs";

export async function GET() {
  const started = Date.now();

  // Mongo
  let mongoStatus: "connected" | "down" = "down";
  let mongoError: string | null = null;
  try {
    const db = await getDbOrNull();
    if (db) mongoStatus = "connected";
  } catch (e: any) {
    mongoError = e?.message || "mongo_error";
  }

  // Railway (if you ping a URL, otherwise mark 'down' by default)
  const railwayStatus: "up" | "down" =
    process.env.RAILWAY_URL ? "up" : "down";

  // OpenAI
  let openaiStatus: "ok" | "missing" | "bad" = "missing";
  let openaiModel = process.env.CHAT_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini";
  if (process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ALT) {
    try {
      // cheap /models call to validate
      const r = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ALT}` },
        cache: "no-store",
      });
      openaiStatus = r.ok ? "ok" : "bad";
    } catch {
      openaiStatus = "bad";
    }
  }

  const info = {
    ok: true,
    next: {
      ok: true,
      vercel: true,
      latencyMs: Date.now() - started,
    },
    mongo: { status: mongoStatus, error: mongoError },
    railway: { status: railwayStatus },
    openai: { status: openaiStatus, model: openaiModel },
  };

  return NextResponse.json(info, { status: 200 });
}
