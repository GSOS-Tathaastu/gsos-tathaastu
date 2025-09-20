"use client";

import { useEffect, useState } from "react";
import type { Question } from "@/lib/types";

type Props = {
  sessionId: string;
  initialQuestions?: Question[];
};

function ToggleBtn({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2 py-1 rounded border text-xs ${
        on ? "bg-indigo-600 text-white border-indigo-600" : "bg-white"
      }`}
    >
      {on ? "Selected" : "Select"}
    </button>
  );
}

export default function SurveyRunner({ sessionId, initialQuestions }: Props) {
  const [qid, setQid] = useState<string>("");
  const [q, setQ] = useState<Question | null>(null);
  const [answered, setAnswered] = useState(0);
  const [total, setTotal] = useState(0);
  const [val, setVal] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // If preloaded
  useEffect(() => {
    if (initialQuestions?.length) {
      setTotal(initialQuestions.length);
      setQ(initialQuestions[0]);
      setQid(initialQuestions[0].id);
    } else {
      // fetch first question from API
      nextQ();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  async function nextQ() {
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/survey/next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || "Failed");
      if (j.finished) {
        setDone(true);
        return;
      }
      setAnswered(j.answered);
      setTotal(j.total);
      setQ(j.next);
      setQid(j.next?.id);
      setVal(null);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function submitAnswer() {
    if (!qid) return;
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/survey/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          answer: { qid, value: val },
        }),
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || "Submit failed");
      if (j.done) {
        setDone(true);
      } else {
        await nextQ();
      }
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  function renderMCQ() {
    if (!q || q.type !== "mcq") return null;

    // Single choice (radio)
    if (q.mode === "single") {
      return (
        <div className="space-y-2">
          {q.options.map((o) => (
            <label key={o.id} className="flex items-center gap-2">
              <input
                type="radio"
                name={q.id}
                value={o.id}
                checked={val === o.id}
                onChange={() => setVal(o.id)}
              />
              <span>{o.label}</span>
            </label>
          ))}
        </div>
      );
    }

    // Multi choice (checkboxes) – supports optional weights
    if (q.mode === "multi") {
      const selected: Record<string, number | true> = Array.isArray(val)
        ? Object.fromEntries(val.map((v: any) => (Array.isArray(v) ? v : [v, true])))
        : {};

      const toggle = (id: string) => {
        const cur = { ...selected };
        if (cur[id]) delete cur[id];
        else cur[id] = true;
        // normalize to array (mix of boolean or [id,weight])
        setVal(Object.entries(cur).map(([k, v]) => (v === true ? k : [k, v])));
      };

      const setWeight = (id: string, w: number) => {
        const cur = { ...selected };
        cur[id] = w;
        setVal(Object.entries(cur).map(([k, v]) => (v === true ? k : [k, v])));
      };

      return (
        <div className="space-y-3">
          {q.options.map((o) => {
            const active = selected[o.id] !== undefined;
            const weightVal = typeof selected[o.id] === "number" ? (selected[o.id] as number) : (o.weight ?? 0);
            return (
              <div key={o.id} className="flex items-center gap-3">
                <ToggleBtn on={active} onClick={() => toggle(o.id)} />
                <span className="flex-1">{o.label}</span>
                {/* Optional weight selector if you want weighted-multi */}
                <input
                  type="number"
                  min={0}
                  max={q.scale || 5}
                  step={1}
                  className="w-20 border rounded px-2 py-1"
                  value={active ? weightVal : 0}
                  onChange={(e) => setWeight(o.id, Number(e.target.value || 0))}
                  title="Weight"
                />
              </div>
            );
          })}
          <p className="text-xs text-gray-500">
            Tip: Select multiple, optionally assign weights (0–{q.scale || 5}).
          </p>
        </div>
      );
    }

    // Ranking — simple up/down reordering (no external lib)
    if (q.mode === "ranking") {
      const current: string[] =
        Array.isArray(val) && val?.length
          ? val
          : q.options.map((o) => o.id);

      const move = (i: number, dir: -1 | 1) => {
        const next = [...current];
        const j = i + dir;
        if (j < 0 || j >= next.length) return;
        [next[i], next[j]] = [next[j], next[i]];
        setVal(next);
      };

      return (
        <div className="space-y-2">
          {current.map((oid, i) => {
            const opt = q.options.find((x) => x.id === oid)!;
            return (
              <div key={oid} className="flex items-center gap-2 border rounded px-2 py-1">
                <span className="w-6 text-xs opacity-70">{i + 1}</span>
                <span className="flex-1">{opt?.label || oid}</span>
                <div className="flex gap-1">
                  <button className="border rounded px-2 py-0.5" type="button" onClick={() => move(i, -1)}>↑</button>
                  <button className="border rounded px-2 py-0.5" type="button" onClick={() => move(i, +1)}>↓</button>
                </div>
              </div>
            );
          })}
          <p className="text-xs text-gray-500">Rank from top (highest) to bottom (lowest).</p>
        </div>
      );
    }

    // Likert (1..scale)
    if (q.mode === "likert") {
      const scale = q.scale || 5;
      return (
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={1}
            max={scale}
            step={1}
            value={typeof val === "number" ? val : Math.ceil(scale / 2)}
            onChange={(e) => setVal(Number(e.target.value))}
          />
          <span className="text-sm">Value: {val || Math.ceil(scale / 2)} / {scale}</span>
        </div>
      );
    }

    return null;
  }

  function renderOpen() {
    if (!q || q.type !== "open") return null;
    return (
      <textarea
        className="w-full border rounded p-3"
        rows={4}
        placeholder={q.placeholder || "Type your answer"}
        value={val || ""}
        onChange={(e) => setVal(e.target.value)}
      />
    );
  }

  if (done) {
    return (
      <div className="max-w-xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-2">Thank you!</h2>
        <p>Your survey is complete.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-2 text-sm text-gray-500">
        {answered + 1} / {total}
      </div>
      {q && (
        <div className="rounded-2xl border p-4 bg-white shadow">
          <div className="text-lg font-semibold mb-2">{q.prompt}</div>
          {q.helpText && <p className="text-sm text-gray-500 mb-3">{q.helpText}</p>}
          {q.type === "mcq" ? renderMCQ() : renderOpen()}
          {err && <p className="text-sm text-red-600 mt-3">{err}</p>}
          <div className="mt-4 flex gap-3">
            <button
              className="rounded bg-indigo-600 text-white px-4 py-2"
              onClick={submitAnswer}
              disabled={busy}
            >
              {busy ? "Saving…" : "Save & Next"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
