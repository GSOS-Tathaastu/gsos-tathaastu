"use client";

import { useEffect, useMemo, useState } from "react";
import {
  generateSurvey,
  analyzeSurvey,
  type AnalyzePayload,
  type AnalyzeResult,
  type GeneratedQuestion,
} from "@/lib/gsosClient";

type AnswerMap = Record<string, unknown>;

export default function SurveyPage() {
  const [role, setRole] = useState("retailer");
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResult | null>(null);

  // Load questions
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    generateSurvey(role, 12)
      .then((data) => {
        if (!alive) return;
        // ⬇️ Assert type so TS narrows q.type to the literal union
        setQuestions(data.questions as GeneratedQuestion[]);
        setAnswers({});
        setResult(null);
      })
      .catch((e) => setError(e?.message ?? "Failed to load survey"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [role]);

  // Helpers to set answers
  const setMcq = (id: string, option: string, multi = false) => {
    setAnswers((prev) => {
      const curr = (prev[id] as string[]) || [];
      if (multi) {
        // toggle
        if (curr.includes(option)) {
          return { ...prev, [id]: curr.filter((x) => x !== option) };
        }
        return { ...prev, [id]: [...curr, option] };
      } else {
        // single
        return { ...prev, [id]: [option] };
      }
    });
  };

  const setLikert = (id: string, val: number) => {
    setAnswers((prev) => ({ ...prev, [id]: val }));
  };

  const setShortText = (id: string, val: string) => {
    setAnswers((prev) => ({ ...prev, [id]: val }));
  };

  // Submit → build typed payload → analyze
  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      // Build payload with literal 'type' values so TS narrows to the union
      const payload: AnalyzePayload[] = questions.flatMap((q) => {
        const t = q.type as "mcq" | "likert" | "short_text";
        switch (t) {
          case "mcq": {
            const vals = (answers[q.id] ?? []) as string[];
            return vals.length ? [{ id: q.id, type: "mcq" as const, values: vals }] : [];
          }
          case "likert": {
            const num = Number(answers[q.id]);
            return Number.isFinite(num) ? [{ id: q.id, type: "likert" as const, value: num }] : [];
          }
          case "short_text": {
            const txt = String(answers[q.id] ?? "").trim();
            return txt ? [{ id: q.id, type: "short_text" as const, value: txt }] : [];
          }
          default:
            return [];
        }
      });

      const data = await analyzeSurvey(role, payload);
      setResult(data as AnalyzeResult);
    } catch (e: any) {
      setError(e?.message ?? "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const hasQuestions = useMemo(() => questions.length > 0, [questions.length]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold mb-4">GSOS Readiness Survey</h1>

      {/* Role selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-1">Role</label>
        <select
          className="border rounded px-3 py-2 w-full"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="retailer">Retailer</option>
          <option value="d2c">D2C</option>
          <option value="wholesale">Wholesale</option>
          <option value="manufacturer">Manufacturer</option>
        </select>
      </div>

      {loading && <p>Loading survey…</p>}
      {error && (
        <p className="text-red-600 mb-4">
          {error}
        </p>
      )}

      {hasQuestions && (
        <div className="space-y-6">
          {questions.map((q, idx) => {
            const key = `${q.id}_${idx}`;
            if (q.type === "mcq") {
              const isMulti = Boolean(q.multi);
              const selected = (answers[q.id] as string[]) || [];
              return (
                <div key={key} className="border rounded p-4">
                  <p className="font-medium mb-2">{idx + 1}. {q.prompt}</p>
                  <div className="space-y-2">
                    {(q.options ?? []).map((opt) => {
                      const id = `${q.id}_${opt}`;
                      if (isMulti) {
                        return (
                          <label key={id} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selected.includes(opt)}
                              onChange={() => setMcq(q.id, opt, true)}
                            />
                            <span>{opt}</span>
                          </label>
                        );
                      }
                      return (
                        <label key={id} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={q.id}
                            checked={selected[0] === opt}
                            onChange={() => setMcq(q.id, opt, false)}
                          />
                          <span>{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            }

            if (q.type === "likert") {
              const min = q.min ?? 1;
              const max = q.max ?? 5;
              const val = Number(answers[q.id] ?? Math.ceil((min + max) / 2));
              return (
                <div key={key} className="border rounded p-4">
                  <p className="font-medium mb-2">{idx + 1}. {q.prompt}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-sm">{min}</span>
                    <input
                      type="range"
                      min={min}
                      max={max}
                      value={val}
                      onChange={(e) => setLikert(q.id, Number(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm">{max}</span>
                    <span className="ml-2 text-sm font-medium">Selected: {val}</span>
                  </div>
                </div>
              );
            }

            if (q.type === "short_text") {
              const txt = String(answers[q.id] ?? "");
              return (
                <div key={key} className="border rounded p-4">
                  <p className="font-medium mb-2">{idx + 1}. {q.prompt}</p>
                  <textarea
                    className="w-full border rounded px-3 py-2"
                    rows={4}
                    value={txt}
                    onChange={(e) => setShortText(q.id, e.target.value)}
                    placeholder="Type your answer…"
                  />
                </div>
              );
            }

            return null;
          })}

          <button
            className="mt-2 inline-flex items-center px-4 py-2 rounded bg-black text-white disabled:opacity-50"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Submitting…" : "Submit"}
          </button>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="mt-10 space-y-6">
          <div className="border rounded p-4">
            <h2 className="text-xl font-semibold mb-2">Estimated Savings</h2>
            <ul className="list-disc ml-6 space-y-1">
              <li>Inventory reduction: ~{result.savings.inventory_reduction_pct}%</li>
              <li>Stockout reduction: ~{result.savings.stockout_reduction_pct}%</li>
              <li>On-time delivery (OTD) improvement: ~{result.savings.otd_improvement_pct}%</li>
              <li className="text-sm text-gray-600">{result.savings.notes}</li>
            </ul>
          </div>

          <div className="border rounded p-4">
            <h2 className="text-xl font-semibold mb-2">Analysis Summary</h2>
            <pre className="whitespace-pre-wrap text-sm">{result.summary ?? "—"}</pre>
          </div>

          <div className="border rounded p-4">
            <h2 className="text-xl font-semibold mb-2">Citation Snippets</h2>
            <ul className="list-disc ml-6">
              {result.citations.map((c, i) => (
                <li key={i} className="text-sm">
                  {c.source} #{c.chunk}
                </li>
              ))}
            </ul>
          </div>

          <div className="border rounded p-4">
            <h2 className="text-xl font-semibold mb-2">Plans</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {result.plans.map((p) => (
                <div key={p.name} className="border rounded p-3">
                  <div className="font-medium">{p.name}</div>
                  <div className="text-sm text-gray-700 mb-2">{p.price_range}</div>
                  <ul className="list-disc ml-5 text-sm">
                    {p.features.map((f) => <li key={f}>{f}</li>)}
                  </ul>
                  <div className="text-xs text-gray-500 mt-2">Best for: {p.fit}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="border rounded p-4">
            <h2 className="text-xl font-semibold mb-2">Onboarding</h2>
            <p className="mb-2">{result.onboarding.question}</p>
            <div className="flex flex-wrap gap-2">
              {result.onboarding.options.map((o) => (
                <span key={o} className="px-3 py-1 rounded border">{o}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
