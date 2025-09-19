// frontend/app/api/survey/answer/route.ts
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDbOrNull } from "@/lib/mongo";
import { openai, OPENAI_MODEL } from "@/lib/openai";
import { embedTexts, cosine } from "@/lib/embedding";

type Body = {
  sessionId?: string;
  email?: string;
  role?: string;
  country?: string;
  answers: any[];        // [{ questionId|id, value, ... }]
  questions?: any[];     // optional snapshot
  finalize?: boolean;    // mark session complete
  aiSummary?: boolean;   // keep generating internal summary
};

/** Helper: convert answers to compact bullets for prompting */
function answersToBullets(answers: any[]): string {
  return answers
    .map((a: any, i: number) => {
      const id = a?.questionId ?? a?.id ?? `q${i + 1}`;
      return `• ${id}: ${JSON.stringify(a?.value)}`;
    })
    .join("\n");
}

/** Build a simulation via OpenAI, using RAG over chunks + answers */
async function buildSimulationRAG(params: {
  role: string;
  country: string;
  email?: string;
  compactAnswers: string;
}) {
  const { role, country, email, compactAnswers } = params;

  // 1) Pull chunks (if DB configured) and rank by similarity with a composite query
  const db = await getDbOrNull();
  let contextBlocks: string[] = [];
  if (db) {
    const chunks = await db
      .collection("chunks")
      .find(
        {},
        { projection: { _id: 0, title: 1, docId: 1, page: 1, text: 1, content: 1, embedding: 1 } }
      )
      .limit(4000)
      .toArray();

    const items = chunks
      .filter((c: any) => Array.isArray(c.embedding))
      .map((c: any) => ({
        meta: `${c.title || ""} • ${c.docId || ""}${
          typeof c.page === "number" ? ` p.${c.page}` : ""
        }`.trim(),
        text: (c.text || c.content || "").toString(),
        emb: c.embedding as number[],
      }));

    if (items.length) {
      const [qv] = await embedTexts([
        `role=${role}; country=${country}; answers=${compactAnswers.slice(0, 2000)}`,
      ]);
      const ranked = items
        .map((it) => ({ score: cosine(qv, it.emb), ...it }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 12);
      contextBlocks = ranked.map(
        (r, i) => `[#${i + 1} | ${r.meta} | score=${r.score.toFixed(3)}]\n${r.text.slice(0, 800)}`
      );
    }
  }

  // 2) Ask OpenAI for a JSON simulation
  let simulation: any = null;
  if (process.env.OPENAI_API_KEY) {
    const system =
      "You are a GSOS strategist. Based on context and answers, output a JSON simulation with savings, goals, GSOS value and plans. Be practical. No prose, JSON ONLY.";
    const user = JSON.stringify({
      audience: { role, country, email },
      constraints: {
        fields: [
          "savingsEstimate.shortTermPct",
          "savingsEstimate.midTermPct",
          "savingsEstimate.longTermPct",
          "goals.short[]",
          "goals.mid[]",
          "goals.long[]",
          "gsosValue[]",
          "onboardingWillingnessQuestion",
          "plans.freemium[]",
          "plans.subscription[].tier",
          "plans.subscription[].price",
          "plans.subscription[].features[]",
        ],
      },
      answers: compactAnswers,
      context: contextBlocks,
      format: {
        savingsEstimate: { shortTermPct: "number", midTermPct: "number", longTermPct: "number" },
        goals: { short: ["string"], mid: ["string"], long: ["string"] },
        gsosValue: ["string"],
        onboardingWillingnessQuestion: true,
        plans: {
          freemium: ["string"],
          subscription: [{ tier: "string", price: "string", features: ["string"] }],
        },
      },
    });

    try {
      const completion = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        temperature: 0.2,
        messages: [
          { role: "system", content: system },
          { role: "user", content: `Return strictly valid JSON.\n${user}` },
        ],
      });
      const raw = completion.choices?.[0]?.message?.content?.trim() || "{}";
      // If model wrapped JSON in code fences, strip them:
      const jsonString = raw.replace(/^```json\s*|\s*```$/g, "");
      simulation = JSON.parse(jsonString);
    } catch {
      simulation = null;
    }
  }

  // 3) Fallback if AI unavailable or parsing failed
  if (!simulation) {
    simulation = {
      savingsEstimate: { shortTermPct: 5, midTermPct: 12, longTermPct: 20 },
      goals: {
        short: ["Digitize KYC", "Invoice automation"],
        mid: ["LC pre-approvals", "Smart logistics tracking"],
        long: ["Ecosystem orchestration via GSOS"],
      },
      gsosValue: ["Lower disputes", "Faster LC", "Reduced fraud risk"],
      onboardingWillingnessQuestion: true,
      plans: {
        freemium: ["Basic dashboards", "10 shipments/month", "Email support"],
        subscription: [
          { tier: "Growth", price: "$299/mo", features: ["Unlimited shipments", "Priority KYC"] },
          { tier: "Enterprise", price: "Custom", features: ["SLA", "SSO", "Private connectors"] },
        ],
      },
    };
  }

  return simulation;
}

/** POST: submit answers + return simulation */
export async function POST(req: Request) {
  try {
    const payload = (await req.json()) as Body;
    if (!payload || !Array.isArray(payload.answers)) {
      return NextResponse.json(
        { ok: false, error: "Invalid body: 'answers'[] is required" },
        { status: 400 }
      );
    }

    const db = await getDbOrNull();
    if (!db) {
      return NextResponse.json(
        { ok: false, error: "Database not connected (set MONGO_URI & MONGO_DB)" },
        { status: 200 }
      );
    }

    const sessions = db.collection("survey_sessions");
    const submissions = db.collection("submissions");

    // Ensure session
    let sessionId = payload.sessionId;
    let session: any = null;
    if (sessionId) {
      try {
        session = await sessions.findOne({ _id: new ObjectId(sessionId) });
      } catch {
        session = null;
      }
    }
    if (!session) {
      const newSession = {
        email: payload.email?.toLowerCase().trim() || "",
        role: payload.role || "",
        country: payload.country || "",
        status: "in_progress",
        startedAt: new Date(),
        answers: [],
      };
      const created = await sessions.insertOne(newSession);
      sessionId = created.insertedId.toString();
      session = { _id: created.insertedId, ...newSession };
    }

    // Upsert session with new answers + optional questions + finalize
    const update: any = {
      $set: {
        email: payload.email?.toLowerCase().trim() || session.email || "",
        role: payload.role || session.role || "",
        country: payload.country || session.country || "",
        updatedAt: new Date(),
      },
      $push: {
        answers: { $each: payload.answers.map((a: any) => ({ ...a, ts: new Date() })) },
      },
    };
    if (payload.questions && Array.isArray(payload.questions)) update.$set.questions = payload.questions;
    if (payload.finalize) {
      update.$set.status = "completed";
      update.$set.completedAt = new Date();
    }
    await sessions.updateOne({ _id: new ObjectId(sessionId!) }, update, { upsert: true });

    // Build compact answers for prompts
    const compact = answersToBullets(payload.answers);

    // Optional short internal AI summary (kept for ops)
    let aiSummary: string | null = null;
    if (payload.aiSummary && process.env.OPENAI_API_KEY) {
      try {
        const sys =
          "You are an analyst summarizing a business survey. 4–6 crisp bullets: goals, blockers, actions, and where GSOS helps. No fluff.";
        const user = [
          `Role: ${payload.role || "-"}`,
          `Country: ${payload.country || "-"}`,
          `Email: ${payload.email || "-"}`,
          "",
          "Answers:",
          compact,
        ].join("\n");

        const c = await openai.chat.completions.create({
          model: OPENAI_MODEL,
          temperature: 0.2,
          messages: [
            { role: "system", content: sys },
            { role: "user", content: user },
          ],
        });
        aiSummary = c.choices?.[0]?.message?.content?.trim() || null;
      } catch {
        aiSummary = null;
      }
    }

    // Generate the simulation (AI with RAG; fallback safe)
    const simulation = await buildSimulationRAG({
      role: payload.role || "",
      country: payload.country || "",
      email: payload.email || "",
      compactAnswers: compact,
    });

    // Persist a submission snapshot
    await submissions.insertOne({
      sessionId,
      email: payload.email?.toLowerCase().trim() || session.email || "",
      role: payload.role || session.role || "",
      country: payload.country || session.country || "",
      answers: payload.answers,
      questions: payload.questions || session.questions || null,
      aiSummary,
      simulation,
      createdAt: new Date(),
      finalized: !!payload.finalize,
      source: "survey/answer",
    });

    // Cache simulation on session for quick GET
    await sessions.updateOne(
      { _id: new ObjectId(sessionId!) },
      { $set: { lastSimulation: simulation } }
    );

    return NextResponse.json({ ok: true, id: sessionId, simulation });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}

/** GET: fetch latest simulation by sessionId */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");
    if (!sessionId) {
      return NextResponse.json({ ok: false, error: "sessionId is required" }, { status: 400 });
    }

    const db = await getDbOrNull();
    if (!db) return NextResponse.json({ ok: false, error: "DB not connected" }, { status: 200 });

    const sessions = db.collection("survey_sessions");
    const sdoc = await sessions.findOne(
      { _id: new ObjectId(sessionId) },
      { projection: { lastSimulation: 1 } }
    );
    const simulation = (sdoc as any)?.lastSimulation || null;

    // Fallback: look at latest submission if lastSimulation missing
    if (!simulation) {
      const sub = await db
        .collection("submissions")
        .find({ sessionId })
        .sort({ createdAt: -1 })
        .limit(1)
        .next();
      return NextResponse.json({ ok: true, simulation: sub?.simulation || null });
    }

    return NextResponse.json({ ok: true, simulation });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Unknown error" }, { status: 500 });
  }
}
