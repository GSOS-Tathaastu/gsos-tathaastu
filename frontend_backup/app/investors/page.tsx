// frontend/app/investors/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

function AnalyticsCard({ analytics }: { analytics: any }) {
  if (!analytics) return null;
  if (!analytics.ready) {
    return (
      <div className="border rounded-2xl p-4 mt-3">
        <h3 className="font-semibold">Survey Analytics</h3>
        <p className="text-sm opacity-70 mt-1">
          Collecting data… Completed surveys: {analytics?.totalSurveys ?? 0}. Analytics unlock at 30+.
        </p>
      </div>
    );
  }
  return (
    <div className="border rounded-2xl p-4 mt-3">
      <h3 className="font-semibold">Survey Analytics (summary)</h3>
      <div className="text-sm text-slate-600 mt-2 whitespace-pre-wrap">{analytics.summary}</div>
      {!!(analytics.top?.length) && (
        <div className="mt-2">
          <strong>Top short answers:</strong>
          <ul className="list-disc ml-5">
            {analytics.top.map((t: any, i: number) => (
              <li key={i} className="text-sm">{t.text} — {t.count} reports</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function parseAnswer(answerText?: string) {
  if (!answerText) return { bullets: [] as string[], commentary: "", footer: "" };
  const lines = answerText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const bullets: string[] = [];
  const other: string[] = [];
  let footer = "";
  for (const ln of lines) {
    if (/^(•|-)\s+/.test(ln) || /^\d+\.\s+/.test(ln)) bullets.push(ln.replace(/^(\u2022|-|\d+\.)\s*/, ""));
    else if (/Confidential Information, will be shared during in-person meeting/i.test(ln)) footer = "Confidential Information, will be shared during in-person meeting";
    else other.push(ln);
  }
  return { bullets: bullets.slice(0, 3), commentary: other.join(" "), footer };
}

export default function InvestorsPage() {
  const [authStatus, setAuthStatus] = useState<"ok"|"bad"|null>(null);
  const [pw, setPw] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [analytics, setAnalytics] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Form states (Q&A + EOI)
  const [form, setForm] = useState({ name: "", email: "", amount: "", equity: "", horizon: "", partnerRole: false, question: "" });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ answer?: string; retrieved?: any[]; surveyAnalytics?: any[] } | null>(null);
  const parsed = useMemo(() => parseAnswer(result?.answer), [result]);

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/investors/data", { cache: "no-store" });
      setAuthStatus(r.ok ? "ok" : null);
      fetchAnalytics();
    })();
  }, []);

  async function fetchAnalytics() {
    setLoadingAnalytics(true);
    try {
      const r = await fetch("/api/investors/analytics", { cache: "no-store" });
      if (r.ok) setAnalytics(await r.json());
    } finally { setLoadingAnalytics(false); }
  }

  async function login(e?: any) {
    e?.preventDefault();
    setAuthLoading(true);
    try {
      const r = await fetch("/api/investors/auth", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password: pw }),
      });
      if (r.ok) setAuthStatus("ok"); else setAuthStatus("bad");
      await fetchAnalytics();
    } finally { setAuthLoading(false); }
  }

  async function logout() {
    await fetch("/api/investors/logout", { method: "POST", credentials: "include" });
    setAuthStatus(null);
    setPw("");
  }

  async function submit(e?: any) {
    e?.preventDefault();
    setSubmitting(true);
    setResult(null);
    try {
      const r = await fetch("/api/investors/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Failed");
      setResult(j);
      // keep name/email; clear amounts & question
      setForm(s => ({ ...s, amount: "", equity: "", question: "" }));
      fetchAnalytics();
    } catch (e: any) {
      alert(e.message || "Failed");
    } finally { setSubmitting(false); }
  }

  if (authStatus !== "ok") {
    return (
      <div className="max-w-xl mx-auto p-6">
        <div className="border rounded-2xl p-4">
          <h2 className="text-xl font-semibold">Investor Portal — Login</h2>
          <p className="text-sm opacity-70 mt-1">Enter your access key to continue.</p>
          <form onSubmit={login} className="mt-3 space-y-2">
            <input type="password" className="border rounded p-2 w-full" placeholder="Access key"
              value={pw} onChange={e=>setPw(e.target.value)} />
            <div className="flex gap-2">
              <button className="px-4 py-2 rounded bg-black text-white" disabled={authLoading}>{authLoading ? "Checking…" : "Enter"}</button>
              <button type="button" className="px-3 py-2 rounded border" onClick={()=>setPw("")}>Clear</button>
            </div>
            {authStatus === "bad" && <div className="text-red-600 text-sm">Incorrect key — try again.</div>}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Investor Portal</h2>
        <button className="px-3 py-2 rounded border" onClick={logout}>Logout</button>
      </div>

      {/* Brief */}
      <div className="border rounded-2xl p-4">
        <h3 className="font-semibold">Investor Brief — GSOS (TATHAASTU)</h3>
        <p className="text-sm opacity-80 mt-2">
          GSOS is the intelligence layer for global trade — a modular platform that unifies logistics,
          compliance and trade finance into a single operating system. Pilots show measurable gains
          in cash conversion and logistics efficiency (10–30% cost reduction; DSO improvements via automated financing flows).
        </p>
        {/* Narrated deck hook */}
        <div className="mt-2 text-sm">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" disabled /> Play narrated deck (beta, request access)
          </label>
        </div>
      </div>

      {/* Analytics */}
      {loadingAnalytics ? <div>Loading analytics…</div> : <AnalyticsCard analytics={analytics} />}

      <div className="grid md:grid-cols-3 gap-4">
        {/* Q&A + EOI */}
        <div className="md:col-span-2 border rounded-2xl p-4">
          <h3 className="font-semibold">Ask a question</h3>
          <p className="text-sm opacity-70">Our AI answers from GSOS docs and survey signals. A human will follow up for investments.</p>

          <form onSubmit={submit} className="space-y-2 mt-3">
            <div className="grid md:grid-cols-2 gap-2">
              <input className="border rounded p-2" placeholder="Full name" value={form.name} onChange={e=>setForm(s=>({...s, name: e.target.value}))} />
              <input className="border rounded p-2" placeholder="Email" value={form.email} onChange={e=>setForm(s=>({...s, email: e.target.value}))} />
              <input className="border rounded p-2" placeholder="Amount you may invest (e.g. USD 200,000)" value={form.amount} onChange={e=>setForm(s=>({...s, amount: e.target.value}))} />
              <input className="border rounded p-2" placeholder="Equity (%) you expect" value={form.equity} onChange={e=>setForm(s=>({...s, equity: e.target.value}))} />
            </div>

            <div className="grid md:grid-cols-3 gap-2">
              <select className="border rounded p-2" value={form.horizon} onChange={e=>setForm(s=>({...s, horizon: e.target.value}))}>
                <option value="">Investment horizon</option>
                <option>Immediately</option>
                <option>1–2 months</option>
                <option>Quarterly</option>
                <option>Not now</option>
              </select>
              <label className="border rounded p-2 text-sm flex items-center gap-2">
                <input type="checkbox" checked={form.partnerRole} onChange={e=>setForm(s=>({...s, partnerRole: e.target.checked}))} />
                Interested in a partner role (distribution / co-sell / data)
              </label>
            </div>

            <textarea className="border rounded p-2 w-full min-h-[120px]" placeholder="Question for GSOS"
              value={form.question} onChange={e=>setForm(s=>({...s, question: e.target.value}))} />

            <div className="flex gap-2">
              <button className="px-4 py-2 rounded bg-black text-white" disabled={submitting}>{submitting ? "Submitting…" : "Submit question"}</button>
              <a className="px-4 py-2 rounded border" href="https://calendly.com/" target="_blank">Book a 20-min call</a>
            </div>
          </form>

          {/* AI answer */}
          {result && (
            <div className="mt-4 border rounded-2xl p-3">
              <h4 className="font-semibold">AI Response</h4>

              {!!parsed.bullets.length && (
                <div className="mt-2">
                  <strong>Key facts</strong>
                  <ul className="list-disc ml-5">{parsed.bullets.map((b,i)=><li key={i} className="font-medium">{b}</li>)}</ul>
                </div>
              )}

              {parsed.commentary && (
                <div className="mt-2 text-slate-700">
                  <strong>Commentary</strong>
                  <p className="mt-1">{parsed.commentary}</p>
                </div>
              )}

              {!!(result.retrieved?.length) && (
                <div className="mt-2 text-slate-500">
                  <strong>Context used (excerpts)</strong>
                  <ul className="list-disc ml-5">{result.retrieved.map((r,i)=><li key={i} className="text-sm">{r.excerpt}</li>)}</ul>
                </div>
              )}

              {!!(result.surveyAnalytics?.length) && (
                <div className="mt-2 text-slate-500">
                  <strong>Survey signals used</strong>
                  <ul className="list-disc ml-5">{result.surveyAnalytics.map((s,i)=><li key={i} className="text-sm">{s.text} — {s.count}</li>)}</ul>
                </div>
              )}

              <div className="mt-3 p-2 rounded border bg-amber-50 text-amber-800 text-sm">
                <strong>Confidentiality</strong>
                <div>Confidential Information, will be shared during in-person meeting</div>
              </div>
            </div>
          )}
        </div>

        {/* Quick metrics */}
        <aside className="border rounded-2xl p-4 h-fit md:sticky md:top-4">
          <h4 className="font-semibold">Quick Analytics</h4>
          {loadingAnalytics ? <div>Loading…</div> : (
            <>
              <div className="text-sm text-slate-600 mt-2">
                <div><strong>Total surveys:</strong> {analytics?.totalSurveys ?? "—"}</div>
                <div className="mt-1"><strong>Last updated:</strong> {analytics?.lastUpdated ? new Date(analytics.lastUpdated).toLocaleString() : "—"}</div>
              </div>
              {!!analytics?.ready && !!analytics?.numericStats && (
                <div className="mt-3">
                  <strong>Numeric highlights</strong>
                  <ul className="text-sm list-disc ml-5">
                    {Object.entries(analytics.numericStats).slice(0,5).map(([qid, stat]: any) => (
                      <li key={qid}>{qid}: avg {Number(stat.avg).toFixed(1)} (n={stat.count})</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
