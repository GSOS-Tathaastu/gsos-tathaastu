import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongo";
import { openai } from "@/lib/openai";
import type { SurveySession, QuestionMeta } from "@/lib/types";
import { ObjectId } from "mongodb";

export async function POST(req: Request) {
  try {
    const { sessionId } = await req.json();
    if (!sessionId) return NextResponse.json({ error: "missing_session" }, { status: 400 });

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "gsos");
    const sessions = db.collection<SurveySession>("survey_sessions");
    const session = await sessions.findOne({ _id: new ObjectId(String(sessionId)) });
    if (!session || session.status !== "active") {
      return NextResponse.json({ error: "session_not_active" }, { status: 400 });
    }

    // Build adaptive prompt from history
    const history = session.answers.map(a => `Q: ${a.prompt}\nA: ${Array.isArray(a.response) ? a.response.join(", ") : a.response}`).join("\n\n");
    const role = session.role;

    const sys =
      "You generate follow-up survey questions to diagnose supply chain pain points. " +
      "Return a JSON array of 6 questions. Types allowed: likert(min=1,max=5), mcq(options, multi?), short_text. " +
      "Prefer Likert for maturity checks, MCQ for systems/channels, and short_text for open gaps. Keep prompts crisp.";

    const res = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      input: [
        { role: "system", content: sys },
        { role: "user", content:
          `Role: ${role}\nHistory so far:\n${history}\n\n` +
          `TASK: Generate the next 6 focused questions that dive deeper where the answers suggest gaps. ` +
          `Output JSON with shape: [{id, type, prompt, options?, multi?, min?, max?}]`}
      ],
      temperature: 0.3,
    });

    const text = (res.output_text || "").trim();
    let parsed: any[] = [];
    try { parsed = JSON.parse(text); } catch {
      // fallback: try to extract JSON block
      const m = text.match(/\[[\s\S]*\]/);
      if (m) parsed = JSON.parse(m[0]);
    }
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return NextResponse.json({ error: "ai_parse_failed", raw: text }, { status: 500 });
    }

    // Normalize ids if missing
    const batch: QuestionMeta[] = parsed.map((q: any, idx: number) => ({
      id: q.id || `q_${Date.now()}_${idx}`,
      type: q.type,
      prompt: q.prompt,
      ...(q.options ? { options: q.options } : {}),
      ...(q.multi != null ? { multi: !!q.multi } : {}),
      ...(q.min != null ? { min: Number(q.min) } : {}),
      ...(q.max != null ? { max: Number(q.max) } : {}),
    }));

    await sessions.updateOne({ _id: session._id }, { $set: { currentBatch: batch } });
    return NextResponse.json({ ok: true, currentBatch: batch });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
