import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";

export const runtime = "nodejs";

type QS = {
  id: string;
  type: "mcq" | "likert" | "short_text" | "dropdown";
  prompt: string;
  options: string[] | null;
  multi: boolean;
  min: number | null;
  max: number | null;
};

function fallback(role: string, n: number): QS[] {
  const base: QS[] = [
    { id: "q1", type: "likert", prompt: "Supplier reliability meets targets.", options: null, multi: false, min: 1, max: 5 },
    { id: "q2", type: "mcq", prompt: "Which channels do you sell on?", options: ["Offline retail","Own website","Marketplaces","Social","B2B"], multi: true, min: null, max: null },
    { id: "q3", type: "likert", prompt: "We can trace inventory at batch/lot level.", options: null, multi: false, min: 1, max: 5 },
    { id: "q4", type: "mcq", prompt: "Which integrations do you already use?", options: ["Tally/Zoho","Shopify","Woo","SAP/Oracle","Custom DB"], multi: true, min: null, max: null },
    { id: "q5", type: "short_text", prompt: "Briefly describe your biggest process gap to reach 2× scale.", options: null, multi: false, min: null, max: null },
  ];
  while (base.length < n) {
    const k = base.length + 1;
    base.push({ id: `q${k}`, type: "likert", prompt: `Rate capability #${k} for role ${role}.`, options: null, multi: false, min: 1, max: 5 });
  }
  return base.slice(0, n);
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const role = (url.searchParams.get("role") || "retailer").toString();
    const count = Math.max(10, Math.min(30, parseInt(url.searchParams.get("count") || "12", 10)));

    // ask model to return strict JSON (we'll parse defensively)
    const sys = `You generate concise survey questions for the role: ${role}.
Return STRICT JSON with exactly ${count} questions using this shape:
{"questions":[{"id":"q_xxx","type":"mcq|likert|dropdown|short_text","prompt":"...","options":null or ["A","B"],"multi":false,"min":null or number,"max":null or number}], "role":"..."}

Rules:
- Keep prompts short and unambiguous.
- Use 1–2 word options for mcq/dropdown.
- Include a mix of: likert (min=1,max=5), mcq (multi true/false), dropdown, and 2 short_text.`;

    const r = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      input: sys,                // must be a STRING
      temperature: 0.3,
      max_output_tokens: 1200,
      // response_format is NOT supported by this endpoint in your SDK version — removed
    });

    // Try standard field first
    let outText: string = (r as any).output_text || "";

    // Fallback: extract from items if SDK shapes differ
    if (!outText) {
      const items = (r as any).output;
      if (Array.isArray(items)) {
        const t = items
          .flatMap((it: any) => Array.isArray(it?.content) ? it.content : [])
          .find((c: any) => typeof c?.text === "string")?.text;
        if (t) outText = t;
      }
    }

    // As a last resort, try to extract a JSON block from the text
    let parsed: any = null;
    const tryParse = (s: string) => { try { return JSON.parse(s); } catch { return null; } };
    parsed = tryParse(outText);

    if (!parsed) {
      const m = outText.match(/\{[\s\S]*\}$/); // naive capture of last JSON-ish block
      if (m) parsed = tryParse(m[0]);
    }

    const questions: QS[] = Array.isArray(parsed?.questions)
      ? parsed.questions.map((q: any, i: number) => ({
          id: q.id || `q_${i.toString(16)}`,
          type: (q.type as QS["type"]) || "likert",
          prompt: q.prompt || "Rate this.",
          options: Array.isArray(q.options) ? q.options : null,
          multi: !!q.multi,
          min: typeof q.min === "number" ? q.min : (q.type === "likert" ? 1 : null),
          max: typeof q.max === "number" ? q.max : (q.type === "likert" ? 5 : null),
        }))
      : fallback(role, count);

    return NextResponse.json({ role, questions }, { status: 200 });
  } catch (e: any) {
    const role = "retailer";
    const questions = fallback(role, 12);
    return NextResponse.json({ role, questions, _fallback: true, error: e?.message || "gen_failed" }, { status: 200 });
  }
}
