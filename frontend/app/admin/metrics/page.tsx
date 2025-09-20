// frontend/app/admin/metrics/page.tsx
"use client";

import { useEffect, useState } from "react";

/** Inline tabs so this page is self-contained */
function AdminTabs({ active }: { active: "health" | "metrics" }) {
  const base = "px-3 py-1.5 rounded-lg text-sm font-medium transition border";
  const on = "bg-indigo-600 text-white border-indigo-600";
  const off = "bg-white text-gray-700 hover:bg-gray-100 border-gray-200";
  return (
    <div className="mb-5 flex gap-2">
      <a href="/admin/health" className={`${base} ${active === "health" ? on : off}`}>
        Health
      </a>
      <a href="/admin/metrics" className={`${base} ${active === "metrics" ? on : off}`}>
        Metrics
      </a>
    </div>
  );
}

type Metrics = {
  ok: boolean;
  error?: string;
  counts?: {
    companies?: number;
    submissions?: number;
    submissions7d?: number;
    sessions?: number;
    chunks?: number;
    intents?: number;
    questions?: number;
    surveyDefLogs?: number;
  };
  latencyMs?: number;
};

type DealsSummary = {
  ok: boolean;
  latencyMs: number;
  sources: {
    local: { count: number; lastFetch: string | null };
    db: { ok: boolean; count: number; note: string | null; lastFetch: string | null };
    external: { enabled: boolean; count: number | null; note: string | null; lastFetch: string | null };
  };
};

export default function AdminMetricsPage() {
  const [data, setData] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [deals, setDeals] = useState<DealsSummary | null>(null);
  const [loadingDeals, setLoadingDeals] = useState(true);
  const [errDeals, setErrDeals] = useState<string | null>(null);

  async function loadMetrics() {
    try {
      setLoading(true);
      setErr(null);
      const res = await fetch("/api/admin/metrics", { cache: "no-store" });
      const json = (await res.json()) as Metrics;
      setData(json);
    } catch (e: any) {
      setErr(e?.message || "Failed to load metrics");
    } finally {
      setLoading(false);
    }
  }

  async function loadDeals(refreshExternal = false) {
    try {
      setLoadingDeals(true);
      setErrDeals(null);
      const url = refreshExternal ? "/api/admin/deals/summary?refresh=1" : "/api/admin/deals/summary";
      const res = await fetch(url, { cache: "no-store" });
      const json = (await res.json()) as DealsSummary;
      setDeals(json);
    } catch (e: any) {
      setErrDeals(e?.message || "Failed to load deals summary");
    } finally {
      setLoadingDeals(false);
    }
  }

  useEffect(() => {
    loadMetrics();
    loadDeals(false);
  }, []);

  const cards: { label: string; key: keyof NonNullable<Metrics["counts"]> }[] = [
    { label: "Companies", key: "companies" },
    { label: "Submissions", key: "submissions" },
    { label: "Submissions (7d)", key: "submissions7d" },
    { label: "Survey Sessions", key: "sessions" },
    { label: "Chunks", key: "chunks" },
    { label: "Investor Intents", key: "intents" },
    { label: "Investor Questions", key: "questions" },
    { label: "Survey Def Logs", key: "surveyDefLogs" },
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-3">Admin Metrics</h1>
      <AdminTabs active="metrics" />

      <div className="mb-4 flex gap-3">
        <button
          onClick={loadMetrics}
          className="rounded-lg bg-black text-white px-4 py-2 hover:bg-gray-800"
        >
          Refresh Metrics
        </button>
        <button
          onClick={() => loadDeals(true)}
          className="rounded-lg bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700"
        >
          Refresh External Deals
        </button>
      </div>

      {/* Top metric cards */}
      {loading && <p className="text-gray-500">Loading metrics…</p>}
      {err && <p className="text-red-600">Error: {err}</p>}
      {data && (
        <>
          {!data.ok && (
            <p className="text-red-600 mb-4">{data.error || "Metrics not available"}</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {cards.map(({ label, key }) => (
              <div key={key} className="rounded-xl border p-4 bg-white">
                <div className="text-sm text-gray-600">{label}</div>
                <div className="text-2xl font-semibold">{data.counts?.[key] ?? 0}</div>
              </div>
            ))}
          </div>
          <div className="text-xs text-gray-500 mb-10">
            Metrics latency: {data.latencyMs ?? "—"} ms
          </div>
        </>
      )}

      {/* Deals Sources Summary */}
      <section className="rounded-2xl border p-5 bg-white shadow-sm">
        <h2 className="text-xl font-semibold mb-3">Deals Sources Summary</h2>
        {loadingDeals && <p className="text-gray-500">Loading deals summary…</p>}
        {errDeals && <p className="text-red-600">Error: {errDeals}</p>}

        {deals && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Local */}
              <div className="rounded-xl border p-4">
                <div className="text-sm text-gray-600">Local JSON</div>
                <div className="text-2xl font-semibold">{deals.sources.local.count}</div>
                <div className="text-xs text-gray-500">
                  Last scan: {deals.sources.local.lastFetch || "—"}
                </div>
              </div>

              {/* DB */}
              <div className="rounded-xl border p-4">
                <div className="text-sm text-gray-600">Database</div>
                <div className="text-2xl font-semibold">{deals.sources.db.count}</div>
                <div className="text-xs text-gray-500">
                  Status: {deals.sources.db.ok ? "OK" : "Down"}
                  {deals.sources.db.note ? ` — ${deals.sources.db.note}` : ""}
                </div>
                <div className="text-xs text-gray-500">
                  Last scan: {deals.sources.db.lastFetch || "—"}
                </div>
              </div>

              {/* External */}
              <div className="rounded-xl border p-4">
                <div className="text-sm text-gray-600">External (News/APIs)</div>
                <div className="text-2xl font-semibold">
                  {deals.sources.external.enabled ? (deals.sources.external.count ?? "—") : "Disabled"}
                </div>
                <div className="text-xs text-gray-500">
                  {deals.sources.external.note || "—"}
                </div>
                <div className="text-xs text-gray-500">
                  Last fetch: {deals.sources.external.lastFetch || "—"}
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-500 mt-4">
              Summary latency: {deals.latencyMs} ms
            </div>
          </>
        )}
      </section>
    </div>
  );
}
