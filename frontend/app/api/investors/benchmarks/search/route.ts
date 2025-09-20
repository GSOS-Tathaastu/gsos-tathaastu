// frontend/app/api/investors/benchmarks/search/route.ts
import { NextResponse } from "next/server";
import { isInvestorAuthed } from "@/lib/investorAuth";
import { loadAllDeals, similarDeals } from "@/lib/benchmarks";

export async function POST(req: Request) {
  if (!isInvestorAuthed()) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({} as any));
  const investor = String(body.investor || "");
  const stage = String(body.stage || "");
  const ticket = Number(body.ticket || 0);

  const all = await loadAllDeals({ investorOrg: investor, stage, ticket });
  const matches = similarDeals(all, { investor, stage, ticket });

  return NextResponse.json({ ok: true, total: all.length, matches });
}
