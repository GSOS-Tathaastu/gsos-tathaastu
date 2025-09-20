import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDbOrNull } from "@/lib/mongo";

/**
 * GET /api/survey/simulation?sessionId=...
 * Produces a consistent JSON body even on error.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("sessionId") || "";

  // Helper to return JSON consistently
  const reply = (body: any, status = 200) =>
    new NextResponse(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });

  if (!sessionId) {
    return reply({ ok: false, error: "missing_sessionId" }, 400);
  }

  try {
    const db = await getDbOrNull();

    // If DB down, return a graceful placeholder (prevents empty body)
    if (!db) {
      return reply({
        ok: true,
        simulation: fallbackSimulation(),
        note: "DB not connected; returning placeholder simulation.",
      });
    }

    const ses = db.collection("survey_sessions");
    let session: any = null;
    try {
      session = await ses.findOne({ _id: new ObjectId(sessionId) });
    } catch {
      // invalid ObjectId → still continue gracefully
      session = null;
    }

    if (!session) {
      return reply({
        ok: true,
        simulation: fallbackSimulation(),
        note: "Session not found; returning placeholder simulation.",
      });
    }

    // Compute simulation from answers (very simple heuristic for now)
    const answers = Array.isArray(session.answers) ? session.answers : [];
    const favorable = answers.filter((a: any) =>
      String(a?.value ?? "").toLowerCase().match(/agree|yes|ready|improve|reduce/)
    ).length;
    const total = answers.length || 1;

    const lift = Math.min(30, Math.max(5, Math.round((favorable / total) * 25)));

    const sim = {
      savingsEstimate: {
        shortTermPct: Math.max(3, Math.min(10, Math.round(lift * 0.25))),
        midTermPct: Math.max(8, Math.min(18, Math.round(lift * 0.6))),
        longTermPct: Math.max(12, Math.min(30, lift)),
      },
      goals: {
        short: ["Digitize KYC & onboarding", "Automate invoicing & docs", "Exception alerts for logistics"],
        mid: ["LC pre-approvals with risk checks", "Smart shipment visibility", "Unified compliance reports"],
        long: ["Ecosystem orchestration via GSOS", "Fraud risk scoring across corridors"],
      },
      gsosValue: [
        "Lower disputes via verified identities & contracts",
        "Faster working capital with clean, machine-checkable docs",
        "Reduced fraud/AML risk with shared compliance graph",
      ],
      onboardingWillingnessQuestion: true,
      plans: {
        freemium: ["Basic dashboards", "10 shipments/month", "1 corridor"],
        subscription: [
          { tier: "Growth", price: "$299/mo", features: ["Unlimited shipments", "Multi-corridor", "Priority support"] },
          { tier: "Enterprise", price: "Custom", features: ["SLA", "Private connectors", "On-prem options"] },
        ],
      },
    };

    return reply({ ok: true, simulation: sim });
  } catch (e: any) {
    return reply({ ok: false, error: e?.message || "simulation_failed" }, 500);
  }
}

function fallbackSimulation() {
  return {
    savingsEstimate: { shortTermPct: 5, midTermPct: 12, longTermPct: 20 },
    goals: {
      short: ["Digitize KYC", "Invoice automation"],
      mid: ["LC pre-approvals", "Smart logistics tracking"],
      long: ["Ecosystem orchestration with GSOS"],
    },
    gsosValue: ["Lower disputes", "Faster LC", "Reduced fraud risk"],
    onboardingWillingnessQuestion: true,
    plans: {
      freemium: ["Basic dashboards", "10 shipments/month"],
      subscription: [
        { tier: "Growth", price: "$299/mo", features: ["Unlimited shipments"] },
        { tier: "Enterprise", price: "Custom", features: ["SLA", "Private connectors"] },
      ],
    },
  };
}
