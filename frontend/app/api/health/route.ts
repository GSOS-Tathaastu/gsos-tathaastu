import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    env: {
      hasMongo: !!process.env.MONGODB_URI,
      db: process.env.MONGODB_DB || "gsos",
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      backendUrl: process.env.BACKEND_URL || null, // should be null/undefined now
    },
  });
}
