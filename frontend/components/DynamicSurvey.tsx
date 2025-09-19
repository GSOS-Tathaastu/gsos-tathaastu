// frontend/components/DynamicSurvey.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { Question, SurveyDefinition } from "@/lib/questionBank";

type Props = {
  role: string;
  country: string;
  company: string;
};

export default function DynamicSurvey({ role, country, company }: Props) {
  const [def, setDef] = useState<SurveyDefinition | null>(null);
  const [values, setValues] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const url = `/api/survey/questions?role=${encodeURIComponent(role)}&country=${encodeURIComponent(country)}`;
    fetch(url).then(r => r.json()).then(setDef).catch(() => setToast("Failed to load questions"));
  }, [role, country]);

  const canSubmit = useMemo(() => {
    if (!def) return false;
    for (const q of def.questions) {
      if (q.required) {
        const v = values[q.id];
        if (v === undefined || v === null || v === "") return false;
      }
    }
    return true;
  }, [def, values]);

  function setField(id: string, v: any) {
    setValues(prev => ({ ...prev, [id]: v }));
  }

  async function onSubmit() {
    if (!def) return;
    setSubmitting(true);
    setToast(null);
    try {
      const body = {
        profile: { company, role, country },
        answers: values,
        meta: { userAgent: window.navigator.userAgent, ts: Date.now() },
      };
      const res = await fetch("/api/survey/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Submission failed");
      setToast("✅ Responses submitted successfully.");
      // Optionally clear form
      // setValues({});
    } catch (e: any) {
      setToast("❌ " + (e?.message || "Submission failed"));
    } finally {
      setSubmitting(false);
    }
  }

  if (!def) {
    return <div className="text-sm text-gray-500">Loading survey…</div>;
  }

  return (
    <div className="space-y-6">
      {def.questions.map((q) => (
        <Field key={q.id} q={q} value={values[q.id]} onChange={(v) => setField(q.id, v)} />
      ))}

      <button
        disabled={!canSubmit || submitting}
        onClick={onSubmit}
        className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-50"
      >
        {submitting ? "Submitting…" : "Submit responses"}
      </button>

      {toast && <div className="text-sm">{toast}</div>}
    </div>
  );
}

function Field({ q, value, onChange }: { q: Question; value: any; onChange: (v: any) => void }) {
  const base = "w-full px-4 py-2 rounded-xl border border-gray-300";

  if (q.type === "text") {
    return (
      <div className="space-y-2">
        <label className="font-medium">
          {q.label} {q.required && <span className="text-red-500">*</span>}
        </label>
        <input
          type="text"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={q.placeholder}
          className={base}
        />
      </div>
    );
  }

  if (q.type === "number") {
    return (
      <div className="space-y-2">
        <label className="font-medium">
          {q.label} {q.required && <span className="text-red-500">*</span>}
        </label>
        <input
          type="number"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
          placeholder={q.placeholder}
          className={base}
        />
      </div>
    );
  }

  if (q.type === "select" && q.options?.length) {
    return (
      <div className="space-y-2">
        <label className="font-medium">
          {q.label} {q.required && <span className="text-red-500">*</span>}
        </label>
        <select
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={base}
        >
          <option value="" disabled>Choose…</option>
          {q.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </div>
    );
  }

  if (q.type === "checkbox" && q.options?.length) {
    const arr: string[] = Array.isArray(value) ? value : [];
    function toggle(opt: string) {
      if (arr.includes(opt)) onChange(arr.filter(x => x !== opt));
      else onChange([...arr, opt]);
    }
    return (
      <div className="space-y-2">
        <label className="font-medium">{q.label}</label>
        <div className="flex flex-wrap gap-2">
          {q.options.map(opt => (
            <button
              type="button"
              key={opt}
              onClick={() => toggle(opt)}
              className={`px-3 py-1 rounded-full border ${arr.includes(opt) ? "bg-black text-white" : "bg-white"}`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
