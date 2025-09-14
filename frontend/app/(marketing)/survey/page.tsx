// frontend/app/(marketing)/survey/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { generateSurvey, analyzeSurvey } from "@/lib/gsosClient";

type QType = "mcq" | "likert" | "short_text";

type Question = {
  id: string;
  type: QType;
  prompt: string;
  options?: string[];
  min?: number;
  max?: number;
  multi?: boolean; // multi-select for MCQs
};

type AnalyzeResult = {
  ok: boolean;
  savings: {
    inventory_reduction_pct: number;
    stockout_reduction_pct: number;
    otd_improvement_pct: number;
    notes: string;
  };
  summary: string | null;
  citations: { source: string; chunk: number }[];
  plans: { name: string; price_range: string; features: string[]; fit: string }[];
  onboarding: { question: string; options: string[] };
  meta: any;
};

export default function SurveyPage() {
  const [role, setRole] = useState("retailer");
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const questionCount = 12; // backend enforces 10–15

  // Load questions on mount / role change
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setGenerating(true);
      setError(null);
      setResult(null);
      setAnswers({});
      try {
        const data = await generateSurvey(role, questionCount);
        if (!cancelled) setQuestions(data.questions as Question[]);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Failed to load survey");
      } finally {
        if (!cancelled) setGenerating(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  // ---- input updaters ----
  function updateMcq(q: Question, value: string) {
    if (q.multi) {
      const prev: string[] = Array.isArray(answers[q.id]) ? answers[q.id] : [];
      const set = new Set(prev);
      set.has(value) ? set.delete(value) : set.add(value);
      setAnswers({ ...answers, [q.id]: Array.from(set) });
    } else {
      setAnswers({ ...answers, [q.id]: value });
    }
  }

  function updateLikert(q: Question, value: number) {
    setAnswers({ ...answers, [q.id]: value });
  }

  function updateShortText(q: Question, value: string) {
    setAnswers({ ...answers, [q.id]: value });
  }

  // ---- submit ----
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const payload = questions.map((q) => {
        if (q.type === "mcq") {
          const v = answers[q.id];
          return {
            id: q.id,
            type: "mcq",
            values: q.multi ? (Array.isArray(v) ? v : []) : v ? [v] : [],
          };
        } else if (q.type === "likert") {
          return {
            id: q.id,
            type: "likert",
            value: Number(answers[q.id] ?? 0),
          };
        } else if (q.type === "short_text") {
          return {
            id: q.id,
            type: "short_text",
            value: String(answers[q.id] ?? "").trim(),
          };
        }
        return { id: q.id };
      });

      const data = await analyzeSurvey(role, payload);
      setResult(data as AnalyzeResult);
    } catch (e: any) {
      setError(e?.message ?? "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  const allAnswered = useMemo(() => questions.length > 0, [questions]);
  const hasQuestions = questions.length > 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold">GSOS Readiness Survey</h1>
        <p className="text-gray-600 mt-1">
          Answer a quick survey to estimate potential savings and get a tailored GSOS plan.
        </p>
      </header>

      {/* Role & Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-end gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Your role / vertical</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="border rounded-md px-3 py-2 w-56"
          >
            <option value="retailer">Retailer</option>
            <option value="d2c">D2C Brand</option>
            <option value="distributor">Distributor</option>
            <option value="manufacturer">Manufacturer</option>
            <option value="marketplace">Marketplace</option>
          </select>
        </div>
        <button
          type="button"
          onClick={() => setRole((r) => r)} // no-op; you can replace with a dedicated "refetch" if needed
          className="px-4 py-2 rounded-md border md:ml-2"
          disabled={generating}
          title="Regenerate questions"
        >
          {generating ? "Generating…" : "Regenerate"}
        </button>
      </div>

      {/* Survey Form */}
      <form onSubmit={onSubmit} className="space-y-6">
        {generating && (
          <div className="p-4 rounded-lg border animate-pulse">
            Preparing your questions…
          </div>
        )}

        {!generating && hasQuestions && (
          <>
            {questions.map((q) => (
              <div key={q.id} className="p-4 rounded-lg border">
                <div className="font-medium mb-2">{q.prompt}</div>

                {/* MCQ */}
                {q.type === "mcq" && q.options && (
                  <div className="space-y-1">
                    {q.multi && (
                      <div className="text-xs text-gray-500 mb-1">Select all that apply</div>
                    )}
                    {q.options.map((opt) => {
                      const inputId = `${q.id}-${opt}`;
                      if (q.multi) {
                        const selected: string[] = Array.isArray(answers[q.id])
                          ? answers[q.id]
                          : [];
                        const checked = selected.includes(opt);
                        return (
                          <label key={inputId} className="flex items-center gap-2">
                            <input
                              id={inputId}
                              type="checkbox"
                              checked={checked}
                              onChange={() => updateMcq(q, opt)}
                              className="h-4 w-4"
                            />
                            <span>{opt}</span>
                          </label>
                        );
                      } else {
                        const val: string | undefined = answers[q.id];
                        return (
                          <label key={inputId} className="flex items-center gap-2">
                            <input
                              id={inputId}
                              type="radio"
                              name={q.id}
                              checked={val === opt}
                              onChange={() => updateMcq(q, opt)}
                              className="h-4 w-4"
                            />
                            <span>{opt}</span>
                          </label>
                        );
                      }
                    })}
                  </div>
                )}

                {/* Likert */}
                {q.type === "likert" && (
                  <div className="flex items-center gap-4 mt-1">
                    {Array.from(
                      { length: (q.max ?? 5) - (q.min ?? 1) + 1 },
                      (_, i) => (q.min ?? 1) + i
                    ).map((n) => (
                      <label key={`${q.id}-${n}`} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={q.id}
                          checked={Number(answers[q.id] ?? 0) === n}
                          onChange={() => updateLikert(q, n)}
                          className="h-4 w-4"
                        />
                        <span>{n}</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Short Text */}
                {q.type === "short_text" && (
                  <div className="mt-1">
                    <textarea
                      className="w-full border rounded-md p-2 text-sm"
                      rows={3}
                      value={answers[q.id] ?? ""}
                      onChange={(e) => updateShortText(q, e.target.value)}
                      placeholder="Type your response..."
                    />
                  </div>
                )}
              </div>
            ))}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="px-5 py-2 rounded-md bg-black text-white disabled:opacity-50"
                disabled={submitting || !allAnswered}
              >
                {submitting ? "Submitting…" : "Submit"}
              </button>
              {!allAnswered && (
                <span className="text-sm text-gray-500">
                  You can submit even if some answers are blank.
                </span>
              )}
            </div>
          </>
        )}
      </form>

      {/* Error */}
      {error && (
        <div className="mt-6 p-4 rounded-md border border-red-200 bg-red-50 text-red-700">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="mt-10 space-y-8">
          <Section title="Estimated Savings">
            <ul className="list-disc ml-6">
              <li>Inventory reduction: {result.savings.inventory_reduction_pct}%</li>
              <li>Stockout reduction: {result.savings.stockout_reduction_pct}%</li>
              <li>On-time delivery improvement: {result.savings.otd_improvement_pct}%</li>
              <li className="text-sm text-gray-500">{result.savings.notes}</li>
            </ul>
          </Section>

          {result.summary && (
            <Section title="How GSOS Helps (Summary)">
              <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                {result.summary}
              </pre>
            </Section>
          )}

          <Section title="Would you like to onboard GSOS?">
            <div className="flex flex-wrap gap-2">
              {result.onboarding.options.map((o) => (
                <span key={o} className="px-3 py-1 rounded border">
                  {o}
                </span>
              ))}
            </div>
          </Section>

          <Section title="Plans (Guide)">
            <div className="grid md:grid-cols-3 gap-4">
              {result.plans.map((p) => (
                <div key={p.name} className="p-4 rounded-lg border">
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-sm text-gray-600 mb-2">{p.price_range}</div>
                  <ul className="list-disc ml-5 text-sm">
                    {p.features.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                  <div className="text-xs text-gray-500 mt-2">Best for: {p.fit}</div>
                </div>
              ))}
            </div>
          </Section>

          {result.citations?.length > 0 && (
            <Section title="Citations">
              <ul className="list-disc ml-6 text-sm text-gray-600">
                {result.citations.map((c, i) => (
                  <li key={`${c.source}-${c.chunk}-${i}`}>
                    {c.source} #{c.chunk}
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-semibold mb-3">{title}</h2>
      <div>{children}</div>
    </section>
  );
}
