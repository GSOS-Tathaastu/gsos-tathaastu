"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Q = {
  id: string;
  type: "mcq" | "likert" | "open";
  prompt: string;
  options?: string[];
  scale?: "likert-5" | "likert-7";
};

type Props = {
  sessionId: string;
  initialQuestions?: Q[];
};

async function safeJson(res: Response) {
  // Be defensive about empty or non-JSON responses
  const txt = await res.text().catch(() => "");
  if (!txt) return null;
  try {
    return JSON.parse(txt);
  } catch {
    return null;
  }
}

export default function SurveyRunner({ sessionId, initialQuestions = [] }: Props) {
  const router = useRouter();
  const [questions, setQuestions] = useState<Q[]>(initialQuestions);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function loadQuestions() {
    setErr(null);
    try {
      const url = `/api/survey/next?sessionId=${encodeURIComponent(sessionId)}`;
      const res = await fetch(url, { cache: "no-store" });
      const data = await safeJson(res);
      if (!res.ok) {
        throw new Error(
          data?.error ||
            `Failed to fetch questions (HTTP ${res.status}). Make sure the session exists.`
        );
      }
      const qs: Q[] = data?.questions || [];
      setQuestions(qs);
    } catch (e: any) {
      setErr(e?.message || "Failed to load questions.");
    }
  }

  // Fetch questions if we didn't get any from props
  useEffect(() => {
    if (questions.length === 0) loadQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  function setAnswer(qid: string, value: any) {
    setAnswers((prev) => ({ ...prev, [qid]: value }));
  }

  const unanswered = useMemo(
    () => questions.filter((q) => !(q.id in answers)),
    [questions, answers]
  );

  async function finalize() {
    setLoading(true);
    setErr(null);
    try {
      const payload = {
        sessionId,
        answers: Object.entries(answers).map(([questionId, value]) => ({
          questionId,
          value,
        })),
        finalize: true,
        aiSummary: true,
      };

      const res = await fetch("/api/survey/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await safeJson(res);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || `Finalize failed (HTTP ${res.status}).`);
      }
      router.push(`/results?sessionId=${encodeURIComponent(sessionId)}`);
    } catch (e: any) {
      setErr(e?.message || "Finalization error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Start Survey</h1>

      {err && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-red-700">
          {err}
          <div className="mt-2">
            <button
              onClick={loadQuestions}
              className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
            >
              Retry loading questions
            </button>
          </div>
        </div>
      )}

      {questions.length === 0 && !err && (
        <div className="text-sm text-gray-600">
          No questions returned yet. Click “Retry loading questions”, or go back
          to <a href="/start" className="text-indigo-600 underline">Step-0</a> and
          start again.
        </div>
      )}

      {questions.map((q) => (
        <div key={q.id} className="rounded-xl border p-4">
          <div className="font-medium mb-3">{q.prompt}</div>

          {q.type === "mcq" && (
            <div className="space-y-2">
              {(q.options || []).map((opt) => (
                <label key={opt} className="block">
                  <input
                    type="radio"
                    name={q.id}
                    className="mr-2"
                    checked={answers[q.id] === opt}
                    onChange={() => setAnswer(q.id, opt)}
                  />
                  {opt}
                </label>
              ))}
            </div>
          )}

          {q.type === "likert" && (
            <div className="flex gap-2 flex-wrap">
              {["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`rounded border px-3 py-1 ${
                    answers[q.id] === opt ? "bg-indigo-600 text-white" : "hover:bg-gray-50"
                  }`}
                  onClick={() => setAnswer(q.id, opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {q.type === "open" && (
            <textarea
              className="w-full rounded border p-2"
              rows={3}
              value={answers[q.id] || ""}
              onChange={(e) => setAnswer(q.id, e.target.value)}
            />
          )}
        </div>
      ))}

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Answered {Object.keys(answers).length}/{questions.length}
        </div>
        <button
          disabled={loading || unanswered.length > 0 || questions.length === 0}
          onClick={finalize}
          className="rounded bg-indigo-600 text-white px-4 py-2 disabled:opacity-50"
        >
          {loading ? "Submitting…" : "Submit responses"}
        </button>
      </div>
    </main>
  );
}
