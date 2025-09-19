"use client";
import { useEffect, useState } from "react";
import type { QuestionMeta } from "@/lib/types";

export default function SurveyRunner() {
  const [sid, setSid] = useState<string>("");
  const [batch, setBatch] = useState<QuestionMeta[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [role, setRole] = useState("retailer");
  const [loading, setLoading] = useState(false);

  const start = async () => {
    setLoading(true);
    const res = await fetch("/api/survey/start", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ role, participant: { name: "Demo", email: "demo@acme.com", company: "Acme" } }),
    });
    const j = await res.json();
    setSid(j.sessionId);
    setBatch(j.currentBatch || []);
    setAnswers({});
    setLoading(false);
  };

  const submitBatch = async () => {
    setLoading(true);
    const resp = Object.entries(answers).map(([qid, response]) => ({ qid, response }));
    await fetch("/api/survey/answer", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionId: sid, responses: resp }),
    });
    setAnswers({});
    const n = await fetch("/api/survey/next", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionId: sid }),
    });
    const j = await n.json();
    setBatch(j.currentBatch || []);
    setLoading(false);
  };

  const complete = async () => {
    setLoading(true);
    await fetch("/api/survey/complete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionId: sid }),
    });
    setLoading(false);
    alert("Survey completed");
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-end">
        <label className="text-sm">Role:
          <select className="ml-2 border rounded p-1" value={role} onChange={e=>setRole(e.target.value)}>
            <option value="retailer">retailer</option>
            <option value="distributor">distributor</option>
            <option value="manufacturer">manufacturer</option>
          </select>
        </label>
        <button onClick={start} disabled={loading} className="px-3 py-1 rounded bg-black text-white">Start</button>
        <button onClick={submitBatch} disabled={!sid || loading || batch.length===0} className="px-3 py-1 rounded bg-blue-600 text-white">Submit batch</button>
        <button onClick={complete} disabled={!sid || loading} className="px-3 py-1 rounded bg-green-600 text-white">Complete</button>
      </div>

      {!sid && <div className="text-sm opacity-70">Click Start to begin.</div>}

      {batch.length>0 && (
        <div className="space-y-3">
          {batch.map(q => (
            <div key={q.id} className="p-3 border rounded">
              <div className="font-medium">{q.prompt}</div>
              {q.type === "likert" && (
                <input type="number" min={1} max={5} className="border rounded p-1 mt-1"
                  value={answers[q.id] ?? ""} onChange={e=>setAnswers(a=>({...a, [q.id]: Number(e.target.value)}))}/>
              )}
              {q.type === "mcq" && (
                (q as any).multi ? (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {(q as any).options?.map((op:string)=>(
                      <label key={op} className="text-sm">
                        <input type="checkbox"
                          checked={Array.isArray(answers[q.id]) && answers[q.id].includes(op)}
                          onChange={(e)=>{
                            const prev = Array.isArray(answers[q.id]) ? answers[q.id] : [];
                            const next = e.target.checked ? [...prev, op] : prev.filter((x:string)=>x!==op);
                            setAnswers(a=>({...a, [q.id]: next}));
                          }}/>
                        <span className="ml-1">{op}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <select className="border rounded p-1 mt-1" value={answers[q.id] ?? ""} onChange={e=>setAnswers(a=>({...a, [q.id]: e.target.value}))}>
                    <option value="">-- select --</option>
                    {(q as any).options?.map((op:string)=>(<option key={op} value={op}>{op}</option>))}
                  </select>
                )
              )}
              {q.type === "short_text" && (
                <textarea className="border rounded p-1 w-full mt-1" value={answers[q.id] ?? ""} onChange={e=>setAnswers(a=>({...a, [q.id]: e.target.value}))}/>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
