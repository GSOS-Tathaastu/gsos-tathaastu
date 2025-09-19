import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongo";
import { openai } from "@/lib/openai";
import type { SurveySession, AnswerRecord, QuestionMeta } from "@/lib/types";
import { ObjectId } from "mongodb";

export async function POST(req: Request) {
  try {
    const { sessionId, responses } = await req.json();
    if (!sessionId || !responses) return NextResponse.json({ error: "missing_params" }, { status: 400 });

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "gsos");
    const sessions = db.collection<SurveySession>("survey_sessions");

    const session = await sessions.findOne({ _id: new ObjectId(String(sessionId)) });
    if (!session || session.status !== "active") {
      return NextResponse.json({ error: "session_not_active" }, { status: 400 });
    }

    // responses: [{qid, response}], map to AnswerRecord using currentBatch
    const now = new Date();
    const answersToAdd: AnswerRecord[] = [];
    for (const r of responses as Array<{ qid: string; response: any }>) {
      const q = session.currentBatch.find(b => b.id === r.qid);
      if (!q) continue;
      const meta = { ...q } as any; delete meta.id; delete meta.prompt;
      const rec: AnswerRecord = {
        qid: q.id,
        prompt: q.prompt,
        meta,
        options: (q as any).options,
        response: r.response,
        createdAt: now,
      };
      answersToAdd.push(rec);
    }

    // AI: per-answer short notes + rolling summary
    const context = answersToAdd.map(a =>
      `Q: ${a.prompt}\nA: ${Array.isArray(a.response) ? a.response.join(", ") : a.response}`
    ).join("\n\n");

    // Short notes for each answer in one go
    const notesRes = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      input: [
        { role: "system", content: "Write concise, single-sentence notes for each QA pair. One bullet per QA. No fluff." },
        { role: "user", content: context }
      ],
      temperature: 0.2,
    });
    const notesText = (notesRes.output_text || "").split("\n").map(s => s.replace(/^[\s*-•]+/,"").trim()).filter(Boolean);

    // attach notes
    for (let i=0;i<answersToAdd.length;i++){
      answersToAdd[i].aiNotes = notesText[i] || "";
    }

    // Rolling summary (use all answers so far)
    const allAnswers = [...session.answers, ...answersToAdd];
    const allContext = allAnswers.map(a =>
      `Q: ${a.prompt}\nA: ${Array.isArray(a.response) ? a.response.join(", ") : a.response}`
    ).join("\n\n");

    const sumRes = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      input: [
        { role: "system", content:
          "You are a supply-chain consultant. Summarize pain points and opportunities in <=8 bullets. " +
          "Be specific; mention channels, data gaps, automation missing, and integrations needed. End with a one-line priority recommendation." },
        { role: "user", content: allContext }
      ],
      temperature: 0.2,
    });
    const newSummary = (sumRes.output_text || "").trim();

    // Persist: push answers and clear currentBatch (will be replaced by /next)
    await sessions.updateOne(
      { _id: session._id },
      { $push: { answers: { $each: answersToAdd } }, $set: { summary: newSummary, currentBatch: [] } }
    );

    return NextResponse.json({ ok: true, notesAdded: answersToAdd.length, summary: newSummary });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
