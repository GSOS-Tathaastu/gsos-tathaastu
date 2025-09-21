import { NextResponse } from "next/server";

// If you already have a shared OpenAI helper, you can import it instead.
// import { openai } from "@/lib/openai";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { question } = await req.json();
    const q = (question || "").trim();
    if (!q) {
      return NextResponse.json(
        { ok: false, error: "missing_question" },
        { status: 400 }
      );
    }

    // Try OpenAI if configured
    const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ALT;
    const model =
      process.env.CHAT_MODEL ||
      process.env.OPENAI_MODEL ||
      "gpt-4o-mini";

    if (apiKey) {
      // Use native fetch to OpenAI REST to avoid SDK mismatches
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          messages: [
            {
              role: "system",
              content:
                "You are the GSOS investor assistant. Be concise, factual, and helpful. If numbers are estimates, say so.",
            },
            { role: "user", content: q },
          ],
        }),
      });

      if (!r.ok) {
        const text = await r.text();
        return NextResponse.json(
          {
            ok: true,
            answer:
              "OpenAI call failed; using fallback summary. " +
              "GSOS is a global supply operating system that orchestrates identity, finance, logistics and compliance. " +
              "Ask about market size, traction, roadmap, or unit economics.",
            error: text.slice(0, 500),
            fallback: true,
          },
          { status: 200 }
        );
      }

      const j = (await r.json()) as any;
      const answer =
        j?.choices?.[0]?.message?.content ||
        "No answer from the model. Please try again.";
      return NextResponse.json({ ok: true, answer });
    }

    // Fallback answer if no key configured
    return NextResponse.json({
      ok: true,
      answer:
        "AI key not configured. GSOS orchestrates trade data across ERP, documents, banking and logistics to deliver decisions and finance routing. For a live AI answer, set OPENAI_API_KEY in Vercel.",
      fallback: true,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "ask_failed" },
      { status: 400 }
    );
  }
}
