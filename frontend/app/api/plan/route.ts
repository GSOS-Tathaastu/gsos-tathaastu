// frontend/app/api/plan/route.ts
import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";

export async function POST(req: Request) {
  try {
    const { onboarding, summary } = await req.json();
    if (!onboarding || !summary) return NextResponse.json({ error: "bad_request" }, { status: 400 });

    const sys =
      "Produce a crisp, actionable plan for a supply chain client. Output JSON with keys: " +
      "{overview, next30, next60, next90, kpis, integrations, risks, callToAction}. " +
      "Each key should be an array of bullets except overview, callToAction (strings). Be specific, reference their channels/integrations when relevant.";
    const r = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      input: [
        { role: "system", content: sys },
        { role: "user", content:
          `Context:\n${JSON.stringify(onboarding).slice(0, 1200)}\n\nSummary:\n${summary}` }
      ],
      temperature: 0.2,
    });

    const text = (r.output_text || "").trim();
    let plan: any = {};
    try { plan = JSON.parse(text); }
    catch {
      const m = text.match(/\{[\s\S]*\}$/);
      if (m) plan = JSON.parse(m[0]);
    }
    if (!plan || !plan.next30) {
      return NextResponse.json({ error: "ai_parse_failed", raw: text }, { status: 502 });
    }
    return NextResponse.json({ ok: true, plan });
  } catch (e:any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
