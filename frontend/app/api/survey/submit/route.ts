// frontend/app/api/survey/submit/route.ts
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongo";
import { openai } from "@/lib/openai";

export async function POST(req: Request) {
  try {
    const { onboarding, questions, answers } = await req.json();
    if (!onboarding || !Array.isArray(questions) || !answers) {
      return NextResponse.json({ error: "bad_request" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "gsos");
    const sessions = db.collection("survey_sessions");

    const qaLines = questions.map((q: any) => {
      const a = answers[q.id];
      const av = Array.isArray(a) ? a.join(", ") : a ?? "";
      return `Q: ${q.prompt}\nA: ${av}`;
    }).join("\n\n");

    const sys =
      "You are a supply-chain consultant. Summarize the company's situation, pain points and opportunities in <=10 bullets. " +
      "Be specific to channels, data gaps, automation, integrations. End with one priority recommendation line.";
    const r = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      input: [
        { role: "system", content: sys },
        { role: "user", content:
          `Company context:\n${JSON.stringify(onboarding).slice(0,1200)}\n\nSurvey answers:\n${qaLines}` }
      ],
      temperature: 0.2,
    });
    const summary = (r.output_text || "").trim();

    const doc = {
      onboarding,
      questions,
      answers,
      summary,
      status: "completed",
      createdAt: new Date(),
    };
    const { insertedId } = await sessions.insertOne(doc as any);

    return NextResponse.json({ ok: true, sessionId: insertedId, summary });
  } catch (e:any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
