// frontend/lib/gsosClient.ts

export type QType = "mcq" | "likert" | "short_text";

export type GeneratedQuestion = {
  id: string;
  type: QType;
  prompt: string;
  options?: string[];
  min?: number;
  max?: number;
  multi?: boolean;
};

export async function generateSurvey(role: string, count = 12) {
  // backend caps/validates the range (10–15)
  const qs = new URLSearchParams({ path: "generate", role, count: String(count) });
  const res = await fetch(`/api/gsos?${qs.toString()}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`generate failed: ${res.status}`);
  return res.json() as Promise<{ role: string; questions: GeneratedQuestion[] }>;
}

// ---------- Analyze ----------
export type AnalyzePayload =
  | { id: string; type: "mcq"; values: string[] }
  | { id: string; type: "likert"; value: number }
  | { id: string; type: "short_text"; value: string };

export type AnalyzeResult = {
  ok: boolean;
  savings: {
    inventory_reduction_pct: number;
    stockout_reduction_pct: number;
    otd_improvement_pct: number;
    notes: string;
  };
  summary: string | null;
  citations: { source: string; chunk: number }[];
  plans: { name: string; price_range: string; features: string[]; fit: string }[];
  onboarding: { question: string; options: string[] };
  meta: any;
};

export async function analyzeSurvey(
  role: string,
  answers: AnalyzePayload[],
): Promise<AnalyzeResult> {
  const res = await fetch(`/api/gsos?path=analyze`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ role, answers }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`analyze failed: ${res.status}`);
  return res.json();
}

// frontend/app/api/gsos/route.ts
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL; // e.g. https://<railway-domain>
const BACKEND_KEY = process.env.BACKEND_API_KEY || "";

export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get("path");
  if (!BACKEND_URL) return NextResponse.json({ error: "Missing BACKEND_URL" }, { status: 500 });

  if (path === "generate") {
    const role = req.nextUrl.searchParams.get("role") || "retailer";
    const count = req.nextUrl.searchParams.get("count") || "12";
    const url = `${BACKEND_URL}/generate?role=${encodeURIComponent(role)}&count=${encodeURIComponent(count)}`;
    const r = await fetch(url, { headers: { "x-api-key": BACKEND_KEY } });
    return NextResponse.json(await r.json(), { status: r.status });
  }

  // other GET handlers if any…

  return NextResponse.json({ error: "unsupported GET path" }, { status: 404 });
}

export async function POST(req: NextRequest) {
  const path = req.nextUrl.searchParams.get("path");
  if (!BACKEND_URL) return NextResponse.json({ error: "Missing BACKEND_URL" }, { status: 500 });

  if (path === "ask") {
    const body = await req.json();
    const r = await fetch(`${BACKEND_URL}/ask`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": BACKEND_KEY },
      body: JSON.stringify(body),
    });
    return NextResponse.json(await r.json(), { status: r.status });
  }

  if (path === "analyze") {
    const body = await req.json();
    const r = await fetch(`${BACKEND_URL}/analyze`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": BACKEND_KEY },
      body: JSON.stringify(body),
    });
    return NextResponse.json(await r.json(), { status: r.status });
  }

  return NextResponse.json({ error: "unsupported POST path" }, { status: 404 });
}
