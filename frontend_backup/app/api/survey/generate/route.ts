import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

/**
 * HYBRID STRATEGY:
 * - If BACKEND_URL is set, try `${BACKEND_URL}/generate?...`
 * - If backend fails (401/5xx/network) or not set, use LOCAL fallback with OpenAI Chat Completions.
 *
 * Required env for local fallback:
 *   OPENAI_API_KEY=sk-... or sk-proj-...
 * Optional:
 *   OPENAI_PROJECT_ID=proj_...
 *   OPENAI_ORG_ID=org_...
 *   OPENAI_MODEL=gpt-4o-mini (default)
 *
 * Optional backend auth:
 *   BACKEND_URL=https://gsos-tathaastu-production.up.railway.app
 *   BACKEND_API_KEY=your-key
 *   BACKEND_AUTH_SCHEME=Bearer | X-API-Key (default: Bearer)
 */

const BACKEND = (process.env.BACKEND_URL || "").replace(/\/+$/, "");
const BKEY = process.env.BACKEND_API_KEY || "";
const SCHEME = (process.env.BACKEND_AUTH_SCHEME || "Bearer").trim();

function backendHeaders() {
  const h: Record<string, string> = { accept: "application/json" };
  if (!BKEY) return h;
  const scheme = SCHEME.toLowerCase();
  if (scheme === "bearer") h.authorization = `Bearer ${BKEY}`;
  else if (scheme === "x-api-key") h["x-api-key"] = BKEY;
  else { h.authorization = `Bearer ${BKEY}`; h["x-api-key"] = BKEY; }
  return h;
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const role = (sp.get("role") || "retailer").trim();
  const requestedCount = parseInt(sp.get("count") || "12", 10) || 12;
  const count = Math.max(requestedCount, 10);
  const seed = sp.get("seed") || String(Date.now() % 100000);

  // 1) Prefer backend if configured
  if (BACKEND) {
    const url = `${BACKEND}/generate?role=${encodeURIComponent(role)}&count=${count}&seed=${encodeURIComponent(seed)}`;
    try {
      const r = await fetch(url, { cache: "no-store", headers: backendHeaders() });
      const text = await r.text();
      let data: any = null;
      try { data = JSON.parse(text); } catch {}
      if (r.ok && data && Array.isArray(data.questions)) {
        return NextResponse.json({ role: data.role || role, questions: data.questions, source: "backend" });
      }
      // 401/5xx => fall back local; other 4xx (except 401) => surface error
      if (r.status !== 401 && r.status < 500) {
        return NextResponse.json({ error: "proxy_failed", status: r.status, details: data || text || "unknown" }, { status: 502 });
      }
    } catch {
      // network error -> local fallback
    }
  }

  // 2) Local fallback with Chat Completions
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "local_generation_unavailable", hint: "Set OPENAI_API_KEY or configure BACKEND_URL." },
      { status: 500 }
    );
  }

  try {
    const openai = new OpenAI({
      apiKey,
      ...(process.env.OPENAI_PROJECT_ID ? { project: process.env.OPENAI_PROJECT_ID } : {}),
      ...(process.env.OPENAI_ORG_ID ? { organization: process.env.OPENAI_ORG_ID } : {}),
    });

    // Make it deterministic-ish per seed
    const temp = 0.3;

    const sys =
      "You are GSOS survey designer. Generate readiness questions to assess supply-chain maturity for the given role. " +
      "Mix Likert(1–5), MCQ, dropdown, and 2–4 short_text. Keep questions business-relevant and measurable. " +
      "Output STRICT JSON only with the following shape: " +
      '{"role":"<role>","questions":[{"id":"q_xxx","type":"likert|mcq|dropdown|short_text","prompt":"...",' +
      '"options": ["..."]|null,"multi":true|false,"min":number|null,"max":number|null}]} ' +
      "For likert include min=1,max=5. For mcq include options and multi if multi-select. For dropdown include options. " +
      "Vary phrasing based on the seed. Do not include any commentary outside JSON.";

    const usr = `Role: ${role}
Seed: ${seed}
Count: ${count}
Quantitative minimum: ${Math.max(16, count - 3)}
Short_text: 2–4
Return strict JSON only.`;

    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    const chat = await openai.chat.completions.create({
      model,
      temperature: temp,
      messages: [
        { role: "system", content: sys },
        { role: "user", content: usr },
      ],
    });

    const text = chat.choices?.[0]?.message?.content?.trim() || "";
    // Extract JSON block if the model wraps it
    const jsonStr = (() => {
      const m = text.match(/\{[\s\S]*\}$/);
      return m ? m[0] : text;
    })();

    let data: any = null;
    try { data = JSON.parse(jsonStr); } catch (e) {
      return NextResponse.json({ error: "bad_local_payload", raw: text }, { status: 500 });
    }

    if (!data || !Array.isArray(data.questions)) {
      return NextResponse.json({ error: "bad_local_payload", raw: data }, { status: 500 });
    }

    const norm = data.questions.map((q: any, i: number) => ({
      id: q.id || `q_${String(i + 1).padStart(2, "0")}`,
      type: q.type,
      prompt: q.prompt,
      options: q.options ?? null,
      multi: !!q.multi,
      min: q.type === "likert" ? (q.min ?? 1) : (q.min ?? null),
      max: q.type === "likert" ? (q.max ?? 5) : (q.max ?? null),
    }));

    return NextResponse.json({ role, questions: norm, source: "local" });
  } catch (err: any) {
    return NextResponse.json({ error: "local_generation_error", details: String(err?.message || err) }, { status: 500 });
  }
}
