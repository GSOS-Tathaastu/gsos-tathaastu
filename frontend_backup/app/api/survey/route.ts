// app/api/survey/route.ts
import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";

// --- In-memory cache (survives hot reloads in dev) ---
const g = globalThis as any;
g.__SURVEY_CACHE__ ||= [] as any[];
const surveyCache: any[] = g.__SURVEY_CACHE__;

// --- Helpers (Mongo is optional) ---
const MONGO_URI = process.env.MONGO_URI || "";
// If you want to pre-wire a future Mongo client, you can do it here.
// For now we just keep optional stubs:
async function saveToMongo(doc: any) {
  // TODO: implement when ready (connect, insert)
  // Example with mongoose or mongodb driver later.
  return { ok: true, from: "mongo", saved: doc };
}
async function loadFromMongo() {
  // TODO: implement when ready (connect, find)
  return { ok: true, from: "mongo", items: [] as any[] };
}

// --- GET: list survey submissions ---
export async function GET() {
  if (!MONGO_URI) {
    return NextResponse.json({ ok: true, from: "memory", items: surveyCache });
  }
  const out = await loadFromMongo();
  return NextResponse.json(out);
}

// --- POST: create a submission ---
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  // Minimal shape validation (extend as needed)
  const payload = {
    createdAt: Date.now(),
    role: body.role ?? null,
    answers: body.answers ?? null,
    meta: body.meta ?? null,
  };

  if (!MONGO_URI) {
    surveyCache.push(payload);
    return NextResponse.json({ ok: true, from: "memory", saved: payload });
  }
  const out = await saveToMongo(payload);
  return NextResponse.json(out);
}
