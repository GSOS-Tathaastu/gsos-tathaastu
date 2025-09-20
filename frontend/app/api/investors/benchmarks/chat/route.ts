// frontend/app/api/investors/benchmarks/chat/route.ts
import { NextResponse } from "next/server";
import { isInvestorAuthed } from "@/lib/investorAuth";
import { loadAllDeals, similarDeals } from "@/lib/benchmarks";
import { chatWithFallback } from "@/lib/ai";

export async function POST(req: Request) {
  if (!isInvestorAuthed()) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({} as any));
  const question = String(body.question || "");
  const investor = String(body.investor || "");
  const stage = String(body.stage || "");
  const ticket = Number(body.ticket || 0);

  if (!question) return NextResponse.json({ ok: false, error: "question required" }, { status: 400 });

  const all = await loadAllDeals({ investorOrg: investor, stage, ticket });
  const peers = similarDeals(all, { investor, stage, ticket });

  const table = peers.slice(0, 12).map((d, i) => {
    const t = d.ticket ? `$${Math.round(d.ticket).toLocaleString()}` : "n/a";
    const e = typeof d.equity === "number" ? `${Math.round(Number(d.equity) * 100)}%` : (d.equity || "n/a");
    return `${i + 1}. ${d.investor || "Anon"} → ${d.company || "portfolio"} | ${d.stage || "?"} | ${t} for ${e} | ${d.date || "-"}`;
  }).join("\n");

  const sys = "You summarize comparable deals without revealing any confidential GSOS info.";
  const usr = `Comparable deals:\n${table || "None"}\n\nQuestion: ${question}\n\nRules:\n- Use only the list above + general public heuristics.\n- No confidential info. Be concise (5–7 sentences).\n- End with: Confidential Information, will be shared during in-person meeting`;

  const text = await chatWithFallback([{ role: "system", content: sys }, { role: "user", content: usr }], { max_tokens: 400, temperature: 0.3 });
  return NextResponse.json({ ok: true, answer: text, peers: peers.slice(0, 12) });
}
