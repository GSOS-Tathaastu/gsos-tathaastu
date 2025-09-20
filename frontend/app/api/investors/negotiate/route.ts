import { NextResponse } from "next/server";
import { investorCookie, verifyToken } from "@/lib/auth";
import { loadAllDeals, similarDeals } from "@/lib/benchmarks";
import { chatWithFallback } from "@/lib/ai";

export async function POST(req: Request) {
  // 1) Auth — check signed investor cookie
  const cookieHeader = req.headers.get("cookie");
  const cookies = investorCookie.parseCookieHeader(cookieHeader);
  const token = cookies[investorCookie.name];
  const session = verifyToken(token);
  if (!session || session.role !== "investor") {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 200 });
  }

  // 2) Parse body
  const body = await req.json().catch(() => ({} as any));
  const investor = body.investor || {};   // { name, org, email }
  const offer = body.offer || {};         // { ticket:"$250k", equity:"2%" }
  const context = String(body.context || "");
  const stage = String(body.stage || "Pre-seed");

  // normalize ticket (strip $, commas)
  const ticketNum =
    Number(String(offer.ticket || "0").replace(/[^0-9.]/g, "")) || 0;

  // 3) Gather deals (from db, local, and optional external sources)
  const allDeals = await loadAllDeals({
    investorOrg: investor.org || investor.name,
    stage,
    ticket: ticketNum,
  });

  // 4) Filter similar deals
  const peers = similarDeals(allDeals, {
    investor: investor.org || investor.name,
    stage,
    ticket: ticketNum,
  });

  const peerBullets = peers
    .slice(0, 8)
    .map((d) => {
      const t = d.ticket ? `$${Math.round(d.ticket).toLocaleString()}` : "n/a";
      const e =
        typeof d.equity === "number"
          ? `${Math.round(Number(d.equity) * 100)}%`
          : d.equity ?? "n/a";
      const meta = [d.stage, d.date].filter(Boolean).join(" · ");
      return `• ${d.investor || "Anon"} → ${d.company || "portfolio"} (${meta}) — ${t} for ${e}`;
    })
    .join("\n");

  // 5) Negotiation prompt
  const sys =
    "You are GSOS's negotiation assistant. " +
    "Always stay professional and factual. " +
    "Use comparable deals as leverage. " +
    "Never reveal confidential GSOS information.";

  const usr =
    `Investor:\n` +
    `- Name/Org: ${investor.name || ""}${investor.org ? ` (${investor.org})` : ""}\n` +
    `- Offer: ticket=${offer.ticket || "?"}, equity=${offer.equity || "?"}, stage=${stage}\n` +
    `- Context: ${context || "-"}\n\n` +
    `Comparable snapshot:\n${peerBullets || "• No similar public deals found in our set."}\n\n` +
    `Task:\n` +
    `1) Propose a counter offer (ticket + equity) realistic but in GSOS's favor.\n` +
    `2) Justify with 3 brief bullets referencing the snapshot (no confidential data).\n` +
    `3) Add a one-line "next step" CTA.\n` +
    `4) End with: "Confidential Information will be shared during in-person meeting".`;

  // 6) Call OpenAI with fallback
  try {
    const text = await chatWithFallback(
      [
        { role: "system", content: sys },
        { role: "user", content: usr },
      ],
      { max_tokens: 500, temperature: 0.2 }
    );

    return NextResponse.json({
      ok: true,
      counter: text,
      peers: peers.slice(0, 8),
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "negotiation_failed" },
      { status: 200 }
    );
  }
}
