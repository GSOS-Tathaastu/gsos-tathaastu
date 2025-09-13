"use client";
import React, { useEffect, useState } from "react";
import MCQ from "@/components/mcq";
import Likert from "@/components/likert";
import { useRouter } from "next/navigation";

type Q = { id: string; type: "mcq"|"likert"|"short_text"; prompt: string; options?: string[]; min?: number; max?: number; };

export default function QuestionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [qs, setQs] = useState<Q[]>([]);
  const [answers, setAnswers] = useState<Record<string, string|number>>({});

  useEffect(() => {
    const ob = sessionStorage.getItem("onboarding");
    if (!ob) { router.replace("/survey"); return; }
    const { role } = JSON.parse(ob);
    fetch(`/api/survey/generate?role=${encodeURIComponent(role)}&count=8`)
      .then(r => r.json())
      .then(d => { setQs(d.questions || []); })
      .finally(()=>setLoading(false));
  }, [router]);

  const onChange = (id: string, val: string|number) => {
    setAnswers(a => ({ ...a, [id]: val }));
  };

  const submit = async () => {
    const onboarding = JSON.parse(sessionStorage.getItem("onboarding") || "{}");
    const rsp = await fetch("/api/survey", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ onboarding, answers })
    });
    if (rsp.ok) {
      const data = await rsp.json();
      sessionStorage.setItem("results", JSON.stringify({ score: data.score, blueprint: data.blueprint }));
      router.push("/survey/thank-you");
    } else {
      alert("Failed to submit. Please try again.");
    }
  };

  if (loading) return <main className="max-w-3xl mx-auto px-4 py-10">Loading questions…</main>;

  return (
    <main className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      <h1 className="text-2xl font-semibold">Answer the questions</h1>
      <div className="space-y-6">
        {qs.map(q => (
          <div key={q.id} className="border rounded-xl p-4">
            {q.type === "mcq" && (
              <MCQ id={q.id} label={q.prompt} options={q.options || []}
                   value={String(answers[q.id] ?? "")}
                   onChange={(v)=>onChange(q.id, v)} />
            )}
            {q.type === "likert" && (
              <Likert id={q.id} label={q.prompt} min={q.min} max={q.max}
                      value={typeof answers[q.id]==="number" ? (answers[q.id] as number) : undefined}
                      onChange={(v)=>onChange(q.id, v)} />
            )}
            {q.type === "short_text" && (
              <div>
                <label className="block mb-1 font-medium">{q.prompt}</label>
                <textarea className="border rounded px-3 py-2 w-full" rows={3}
                          value={String(answers[q.id] ?? "")}
                          onChange={(e)=>onChange(q.id, e.target.value)} />
              </div>
            )}
          </div>
        ))}
      </div>
      <button onClick={submit} className="bg-indigo-600 text-white px-4 py-2 rounded">
        Submit
      </button>
    </main>
  );
}
