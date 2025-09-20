// frontend/app/api/survey/answer/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDbOrNull } from "@/lib/mongo";
import { openai } from "@/lib/openai";

/** Lightweight types to avoid coupling */
type AnswerIn = {
  id?: string;                 // optional client id
  questionId: string;
  value: any;
  ts?: string;
};

type Simulation = {
  savingsEstimate: { shortTermPct: number; midTermPct: number; longTermPct: number };
  goals: { short: string[]; mid: string[]; long: string[] };
  gsosValue: string[];
  onboardingWillingnessQuestion: boolean;
  plans: {
    freemium: string[];
    subscription: Array<{ tier: string; price: string; features: string[] }>;
  };
};

type PostBody = {
  sessionId?: string;
  email?: string;
  role?: string;         // optional legacy
  roleMain?: string;     // preferred
  roleSub?: string;      // preferred
  country?: string;
  answers?: AnswerIn[];
  finalize?: boolean;
  aiSummary?: boolean;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as PostBody;

    // ---- connect DB ----
    const db = await getDbOrNull();
    if (!db) {
      return NextResponse.json({ ok: false, error: "db_unavailable" }, { status: 200 });
    }

    const sessions = db.collection("survey_sessions");

    // ---- resolve or create session ----
    let sessionId = (body.sessionId || "").toString();
    let session: any = null;

    if (sessionId) {
      try {
        session = await sessions.findOne({ _id: new ObjectId(sessionId) });
      } catch {
        session = null;
      }
    }

    if (!session) {
      // create a new session if enough info exists, else fail
      if (!body.email) {
        return NextResponse.json({ ok: false, error: "missing_email_for_new_session" }, { status: 400 });
      }

      const newDoc = {
        email: body.email.toLowerCase().trim(),
        role: body.role || "",
        roleMain: body.roleMain || "",
        roleSub: body.roleSub || "",
        country: body.country || "",
        status: "in_progress",
        startedAt: new Date(),
        answers: [] as AnswerIn[],
        questions: [],          // optional (if you stored them during generate)
        meta: {},
        updatedAt: new Date(),
      };
      const ins = await sessions.insertOne(newDoc);
      sessionId = ins.insertedId.toString();
      session = { _id: ins.insertedId, ...newDoc };
    }

    // ---- normalize incoming answers (deduplicate by questionId, replace last) ----
    const incoming = Array.isArray(body.answers) ? body.answers.filter(a => a && a.questionId) : [];
    if (incoming.length > 0) {
      const map = new Map<string, AnswerIn>();
      // existing answers
      if (Array.isArray(session.answers)) {
        for (const a of session.answers) {
          if (a?.questionId) map.set(a.questionId, a);
        }
      }
      // incoming overwrite existing
      for (const a of incoming) {
        map.set(a.questionId, {
          id: a.id || cryptoLikeId(),
          questionId: a.questionId,
          value: a.value,
          ts: a.ts || new Date().toISOString(),
        });
      }
      const merged = [...map.values()];
      await sessions.updateOne(
        { _id: new ObjectId(sessionId) },
        { $set: { answers: merged, updatedAt: new Date() } }
      );
      session.answers = merged;
    }

    // ---- if not finalizing, just acknowledge ----
    if (!body.finalize) {
      return NextResponse.json({ ok: true, sessionId });
    }

    // ---- compute simulation (deterministic, from answers) ----
    const simulation = computeSimulation(session);

    // ---- optional AI summary (RAG over chunks if present) ----
    let summary: string | null = null;
    if (body.aiSummary) {
      summary = await safeSummarize(db, session, simulation);
    }

    // ---- store results on session ----
    await sessions.updateOne(
      { _id: new ObjectId(sessionId) },
      {
        $set: {
          status: "completed",
          completedAt: new Date(),
          simulation,
          aiSummary: summary,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      ok: true,
      sessionId,
      simulation,
      summary,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "unexpected_error" }, { status: 200 });
  }
}

/* -----------------------------
   Helpers
------------------------------ */

// lightweight id if client didn't pass one
function cryptoLikeId() {
  try {
    // @ts-ignore
    return crypto.randomUUID();
  } catch {
    return Math.random().toString(36).slice(2);
  }
}

/**
 * Heuristic simulation:
 * - inspect answers for positive/negative tone (likert-ish & keywords)
 * - derive pct savings and phased goals
 */
function computeSimulation(session: any): Simulation {
  const answers: AnswerIn[] = Array.isArray(session?.answers) ? session.answers : [];
  const textValues = answers.map(a => `${a.value}`.toLowerCase());

  const positiveWords = ["agree", "yes", "good", "efficient", "automated", "on time", "compliant"];
  const negativeWords = ["disagree", "no", "delays", "manual", "costly", "fraud", "non-compliant"];

  let pos = 0, neg = 0;
  for (const v of textValues) {
    if (positiveWords.some(w => v.includes(w))) pos++;
    if (negativeWords.some(w => v.includes(w))) neg++;
  }

  // base off ratio (keep bounded)
  const total = Math.max(1, pos + neg);
  const score = Math.min(1, Math.max(0, pos / total)); // 0..1
  const headroom = 1 - score;

  // pct savings guess (more headroom → more savings)
  const shortTermPct = Math.round(5 + 15 * headroom);  // 5–20%
  const midTermPct   = Math.round(10 + 25 * headroom); // 10–35%
  const longTermPct  = Math.round(15 + 35 * headroom); // 15–50%

  const roleHint = (session?.roleSub || session?.roleMain || session?.role || "org").toString().toLowerCase();

  const goals = {
    short: [
      "Digitize onboarding & KYC",
      "Standardize invoices & shipments",
      roleHint.includes("logistic") ? "Enable live milestone tracking" : "Enable event-based status tracking",
    ],
    mid: [
      "Automate document checks & LC workflows",
      "Score counterparties & routes for risk",
      roleHint.includes("bank") ? "Integrate trade finance pre-approval" : "Integrate trade finance requests",
    ],
    long: [
      "Full ecosystem orchestration on GSOS",
      "Closed-loop risk & compliance intelligence",
      "Unified performance SLAs across partners",
    ],
  };

  const gsosValue = [
    "Lower disputes via shared truth layer",
    "Faster financing with structured data",
    "Reduced fraud and compliance risk",
  ];

  const plans = {
    freemium: ["Basic dashboards", "Up to 10 shipments/month", "Email support"],
    subscription: [
      { tier: "Growth", price: "$299/mo", features: ["Unlimited shipments", "Finance & risk connectors", "Priority support"] },
      { tier: "Enterprise", price: "Custom", features: ["Private connectors", "SLA & SSO", "On-prem / VPC options"] },
    ],
  };

  return {
    savingsEstimate: { shortTermPct, midTermPct, longTermPct },
    goals,
    gsosValue,
    onboardingWillingnessQuestion: true,
    plans,
  };
}

/**
 * Summarize with OpenAI if key is present.
 * Pulls a few chunks from DB (if collection exists) to provide context.
 * Falls back to a deterministic text if OpenAI or chunks are unavailable.
 */
async function safeSummarize(db: any, session: any, sim: Simulation): Promise<string> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return fallbackSummary(session, sim);
    }

    // pull a few relevant chunks if available
    let contextBlocks: string[] = [];
    try {
      const colls = await db.listCollections().toArray();
      const hasChunks = colls.some((c: any) => (c.name || c?.name) === "chunks");
      if (hasChunks) {
        const chunksCol = db.collection("chunks");
        const role = (session?.roleSub || session?.roleMain || session?.role || "").toString();
        const q = role ? { $text: { $search: role } } : {};
        const sample = await chunksCol.find(q).limit(6).toArray();
        contextBlocks = sample.map((c: any) => c?.text || "").filter(Boolean);
      }
    } catch {
      // ignore — chunks are optional
    }

    const compactAnswers = (Array.isArray(session?.answers) ? session.answers : [])
      .slice(0, 24)
      .map(a => `• ${a.questionId}: ${JSON.stringify(a.value)}`)
      .join("\n");

    const sys = `You are GSOS analyst. Write a crisp internal summary (200-300 words) of this survey for follow-up. 
Focus on pain points, maturity, potential savings, priority actions, and GSOS fit.`;

    const user = `
Company: ${session?.company || "N/A"}
Role: ${session?.roleMain || session?.role || "N/A"} - ${session?.roleSub || "N/A"}
Country: ${session?.country || "N/A"}

Answers:
${compactAnswers || "(no answers captured)"}

Simulation:
- Savings: short ${sim.savingsEstimate.shortTermPct}%, mid ${sim.savingsEstimate.midTermPct}%, long ${sim.savingsEstimate.longTermPct}%
- Goals (short/mid/long): ${JSON.stringify(sim.goals)}
- GSOS value: ${JSON.stringify(sim.gsosValue)}

Context (snippets):
${contextBlocks.map((t, i) => `[${i + 1}] ${t.slice(0, 280)}`).join("\n")}
`;

    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
    });

    const txt = resp?.choices?.[0]?.message?.content?.trim();
    return txt || fallbackSummary(session, sim);
  } catch {
    return fallbackSummary(session, sim);
  }
}

function fallbackSummary(session: any, sim: Simulation) {
  const lines: string[] = [];
  lines.push(`Internal Summary for ${session?.company || "the organization"} (${session?.roleMain || session?.role || "N/A"} – ${session?.roleSub || ""}, ${session?.country || "N/A"}).`);
  lines.push(`Estimated savings potential: short ${sim.savingsEstimate.shortTermPct}%, mid ${sim.savingsEstimate.midTermPct}%, long ${sim.savingsEstimate.longTermPct}%.`);
  lines.push(`Key goals:`);
  lines.push(`- Short: ${sim.goals.short.join("; ")}`);
  lines.push(`- Mid: ${sim.goals.mid.join("; ")}`);
  lines.push(`- Long: ${sim.goals.long.join("; ")}`);
  lines.push(`GSOS can help with: ${sim.gsosValue.join("; ")}.`);
  lines.push(`Recommended next step: start with Freemium to baseline, then move to Growth for full connectors.`);
  return lines.join(" ");
}
