// frontend/app/admin/survey/page.tsx
"use client";

import { useEffect, useState } from "react";

type Def = { role: string; country?: string; questions: { id: string; label: string; type: string; required?: boolean }[] };

export default function AdminSurveyPage() {
  const [role, setRole] = useState("retailer");
  const [country, setCountry] = useState("India");
  const [def, setDef] = useState<Def | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/survey/questions?role=${encodeURIComponent(role)}&country=${encodeURIComponent(country)}`, { cache: "no-store" });
      const j = await res.json();
      setDef(j);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* load once */ }, []);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Survey — Auto Generation</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full rounded-xl border px-3 py-2">
            <option value="retailer">retailer</option>
            <option value="seller">seller</option>
            <option value="buyer">buyer</option>
            <option value="logistics">logistics</option>
            <option value="bank">bank</option>
            <option value="insurer">insurer</option>
            <option value="broker">broker</option>
            <option value="govt">govt</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Country</label>
          <input value={country} onChange={(e) => setCountry(e.target.value)} className="w-full rounded-xl border px-3 py-2" />
        </div>
        <div className="flex items-end">
          <button onClick={load} className="w-full rounded-xl bg-black text-white px-3 py-2 disabled:opacity-50" disabled={loading}>
            {loading ? "Loading…" : "Generate"}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4">
        {def ? (
          <>
            <div className="text-sm text-gray-600">Definition for <b>{def.role}</b> / <b>{def.country}</b> — {def.questions.length} questions</div>
            <ul className="mt-3 list-disc pl-6">
              {def.questions.map(q => (
                <li key={q.id} className="text-sm">
                  <span className="font-medium">{q.label}</span> <span className="text-xs text-gray-500">({q.type}{q.required ? ", required" : ""})</span>
                </li>
              ))}
            </ul>

            <pre className="mt-4 text-xs bg-gray-50 p-3 rounded-xl overflow-x-auto">
{JSON.stringify(def, null, 2)}
            </pre>
          </>
        ) : "No definition yet."}
      </div>
    </div>
  );
}
