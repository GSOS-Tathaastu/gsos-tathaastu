import { openai } from "@/lib/openai";
import { getDbOrNull } from "@/lib/mongo";
import { getChunks } from "@/lib/chunks";

type GenInput = {
  role?: string;
  country?: string;
  company?: string;
  email?: string;
  seedNotes?: string;
  revenue?: string;
  employees?: string;
  operations?: string;
  yearsActive?: string;
};

export async function generateQuestionnaire(input: GenInput): Promise<{
  questions: Array<{
    id: string;
    type: "mcq" | "likert" | "open";
    prompt: string;
    options?: string[];
    scale?: "likert-5" | "likert-7";
  }>;
  source: "db" | "local";
}> {
  const db = await getDbOrNull();
  const { source, chunks } = await getChunks(db);

  // Make a tight context from chunks (keep prompt small)
  const context = chunks
    .slice(0, 15)
    .map((c) => `• ${c.title || c.id}: ${c.text}`)
    .join("\n");

  const sys = [
    "You are a survey designer for trade operations.",
    "Create exactly 20 questions for the given audience.",
    "Keep **17** closed (MCQ or Likert-5) and **3** open-ended.",
    "Do not repeat similar questions. Avoid re-asking company details.",
    "Return strict JSON with a `questions` array.",
  ].join(" ");

  const user = JSON.stringify({
    audience: {
      role: input.role,
      country: input.country,
      company: input.company,
      email: input.email,
    },
    hints: input.seedNotes || "",
    context,
    formats: {
      mcq: { id: "string", type: "mcq", prompt: "string", options: ["string", "..."] },
      likert: { id: "string", type: "likert", prompt: "string", scale: "likert-5" },
      open: { id: "string", type: "open", prompt: "string" }
    }
  });

  // If OPENAI is not configured, throw — caller decides fallback behavior
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY not set");
  }

  // Call the API
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    messages: [
      { role: "system", content: sys },
      {
        role: "user",
        content:
          "Generate JSON only. Example: {\"questions\":[{\"id\":\"q1\",\"type\":\"mcq\",\"prompt\":\"...\",\"options\":[\"A\",\"B\"]}, ...]}\n\nINPUT:" +
          user,
      },
    ],
  });

  const raw = completion.choices?.[0]?.message?.content?.trim() || "{}";
  let parsed: any = {};
  try {
    parsed = JSON.parse(raw);
  } catch {
    // some models wrap JSON in markdown; strip fences
    const cleaned = raw.replace(/```json|```/g, "");
    parsed = JSON.parse(cleaned);
  }

  const qs = Array.isArray(parsed?.questions) ? parsed.questions : [];
  // normalize ids
  const questions = qs.map((q: any, i: number) => ({
    id: String(q.id || `q${i + 1}`),
    type: q.type === "open" ? "open" : q.type === "likert" ? "likert" : "mcq",
    prompt: String(q.prompt || "Question"),
    options: Array.isArray(q.options) ? q.options.slice(0, 8).map(String) : undefined,
    scale: q.scale === "likert-7" ? "likert-7" : "likert-5",
  }));

  return { questions, source };
}
