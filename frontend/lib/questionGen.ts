// frontend/lib/questionGen.ts
import { openai } from "./openai";

type Audience = {
  roleMain: string;
  roleSub: string;
  company?: string;
  country: string;
  email: string;
  revenue?: string;
  employees?: string;
  operations?: string;
  yearsActive?: string;
};

export async function generateQuestions({ audience }: { audience: Audience }) {
  // context block for AI
  const context = `
You are GSOS survey generator.
Create atleast 20 questions tailored to:
Role: ${audience.roleMain} – ${audience.roleSub}
Company: ${audience.company || "N/A"}
Country: ${audience.country}
Revenue: ${audience.revenue || "N/A"}
Employees: ${audience.employees || "N/A"}
Operations: ${audience.operations || "N/A"}
Years Active: ${audience.yearsActive || "N/A"}

Rules:
- 17 quantitative/MCQ/Likert-scale questions
- 3 qualitative open-ended questions
- Avoid asking same details again (no duplicate company, revenue, etc.)
- Do not repeat similar questions
- Output JSON with array of { id, type, prompt, options? }
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.7,
    messages: [
      { role: "system", content: context },
      { role: "user", content: "Generate the tailored survey now." },
    ],
    response_format: { type: "json_object" },
  });

  let parsed: any;
  try {
    parsed = JSON.parse(completion.choices[0].message.content || "{}");
  } catch {
    parsed = { questions: [] };
  }

  return parsed.questions || [];
}
