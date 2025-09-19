"use client";

import { useEffect, useState } from "react";

type GeneratedQuestion = {
  id: string;
  type: "mcq" | "likert" | "short_text" | "dropdown";
  prompt: string;
  options?: string[] | null;
  multi?: boolean;
  min?: number | null;
  max?: number | null;
};

export default function SurveyQuestionsPage() {
  const [qs, setQs] = useState<GeneratedQuestion[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const obRaw = sessionStorage.getItem("onboarding");
      let role = "retailer";
      if (obRaw) {
        try { role = JSON.parse(obRaw)?.role || role; } catch {}
      }
      const seed = Date.now().toString().slice(-6);
      setLoading(true);
      fetch(`/api/survey/generate?role=${encodeURIComponent(role)}&count=12&seed=${seed}`, { cache: "no-store" })
        .then(async (r) => {
          const j = await r.json().catch(() => ({}));
          if (!r.ok || !Array.isArray(j?.questions)) {
            const details = typeof j?.details === "string" ? j.details : JSON.stringify(j?.details || "");
            throw new Error(details || "Survey generate failed");
          }
          setQs(j.questions as GeneratedQuestion[]);
        })
        .catch((e) => {
          console.error("survey generate error:", e);
          setError(String(e?.message || e) || "Survey generate failed");
          setQs([]);
        })
        .finally(() => setLoading(false));
    } catch (e: any) {
      setError(String(e?.message || e));
      setLoading(false);
    }
  }, []);

  if (loading) return <div className="p-6">Generating questions…</div>;
  if (error) return <div className="p-6 text-red-600">Survey generate failed: {error}</div>;

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Readiness Survey — Questions</h1>
      {!qs.length ? (
        <div className="opacity-70">No questions loaded.</div>
      ) : (
        <ol className="space-y-4 list-decimal pl-5">
          {qs.map((q) => (
            <li key={q.id} className="border rounded-xl p-4">
              <div className="font-medium">{q.prompt}</div>
              {q.type === "mcq" && q.options?.length ? (
                <ul className="mt-2 space-y-1">
                  {q.options.map((opt) => (
                    <li key={opt} className="text-sm opacity-80">
                      {q.multi ? <input type="checkbox" className="mr-2" /> : <input type="radio" name={q.id} className="mr-2" />}
                      {opt}
                    </li>
                  ))}
                </ul>
              ) : q.type === "likert" ? (
                <div className="mt-2 flex gap-3 items-center">
                  <span className="text-xs opacity-60">{q.min ?? 1}</span>
                  <input type="range" min={q.min ?? 1} max={q.max ?? 5} defaultValue={Math.ceil(((q.min ?? 1) + (q.max ?? 5)) / 2)} className="w-64" />
                  <span className="text-xs opacity-60">{q.max ?? 5}</span>
                </div>
              ) : q.type === "dropdown" && q.options?.length ? (
                <select className="mt-2 border rounded p-2">
                  {q.options.map((opt) => (
                    <option key={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <textarea className="mt-2 border rounded p-2 w-full" rows={3} placeholder="Type your response…" />
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
