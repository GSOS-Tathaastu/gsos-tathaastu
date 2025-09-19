"use client";

import { useEffect, useState } from "react";

type Ping = { path: string; ok: boolean; status: number; latencyMs: number; error?: string; body?: any };
type HealthResponse = {
  status: "ok" | "degraded";
  latencyMs: number;
  checks: {
    nextApi: { ok: boolean; message: string };
    mongo: { ok: boolean; message: string };
    pages: Ping[];
    apis: Ping[];
    backend: any;
  };
  envPresence: Record<string, boolean>;
  runtime: { node: string; vercel: boolean };
  ts: string;
};

type MetricsResponse = {
  ok: boolean;
  error?: string;
  counts: {
    chunks: number;
    companies: number;
    investor_intents: number;
    investor_questions: number;
    submissions: number;
    survey_defs_logs: number;
    survey_sessions: number;
  };
  collections: { name: string; count: number }[];
  dbStats: any;
  extra?: { submissions_last_7d?: number };
  runtime: { node: string; vercel: boolean; uptimeSec: number; pid: number };
  latencyMs: number;
  ts: string;
};

export default function AdminHealthPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [lastUpdated, setLastUpdated] = useState("");

  async function refresh() {
    try {
      const [h, m] = await Promise.all([
        fetch("/api/health", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/admin/metrics", { cache: "no-store" }).then((r) => r.json()),
      ]);
      setHealth(h);
      setMetrics(m);
      setLastUpdated(new Date().toLocaleString());
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 10000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">System Health</h1>
        <button onClick={refresh} className="px-4 py-2 rounded-xl bg-black text-white">
          Refresh
        </button>
      </div>

      {/* SUMMARY STATUS */}
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          title="Next.js API"
          status="ok"
          lines={[
            `Latency: ${health?.latencyMs ?? "—"} ms`,
            `node=${health?.runtime.node ?? "?"} vercel=${health?.runtime.vercel ?? false}`,
          ]}
        />
        <SummaryCard
          title="MongoDB"
          status={health?.checks.mongo.ok ? "ok" : "down"}
          lines={[health?.checks.mongo.message || "—"]}
        />
        <SummaryCard
          title="Railway Backend"
          status={(health?.checks.backend?.ok && "ok") || "down"}
          lines={[
            health?.checks.backend?.error
              ? String(health.checks.backend.error)
              : "NEXT_PUBLIC_BACKEND_URL not set?",
          ]}
        />
      </div>

      {/* PAGES */}
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Pages</h2>
        <div className="rounded-2xl border bg-white p-4">
          <Table
            headers={["Path", "Status", "Latency", "Error"]}
            rows={(health?.checks.pages || []).map((p) => [
              p.path,
              p.ok ? "OK" : String(p.status),
              `${p.latencyMs} ms`,
              p.error || "",
            ])}
          />
        </div>
      </section>

      {/* APIs */}
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">APIs</h2>
        <div className="rounded-2xl border bg-white p-4">
          <Table
            headers={["Path", "Status", "Latency", "Error / Body (short)"]}
            rows={(health?.checks.apis || []).map((p) => [
              p.path,
              p.ok ? "OK" : String(p.status),
              `${p.latencyMs} ms`,
              p.error ? (
                <span className="text-red-600">{p.error}</span>
              ) : (
                JSON.stringify(p.body).slice(0, 160)
              ),
            ])}
          />
        </div>
      </section>

      {/* DATABASE METRICS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Database Metrics</h2>
          <span className="text-xs text-gray-500">
            {metrics?.ok ? "connected" : metrics?.error || "not configured"}
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <Metric label="Companies" value={metrics?.counts.companies ?? 0} />
          <Metric label="Submissions" value={metrics?.counts.submissions ?? 0} />
          <Metric label="Submissions (7d)" value={metrics?.extra?.submissions_last_7d ?? 0} />
          <Metric label="Survey Sessions" value={metrics?.counts.survey_sessions ?? 0} />
          <Metric label="Chunks" value={metrics?.counts.chunks ?? 0} />
          <Metric label="Investor Intents" value={metrics?.counts.investor_intents ?? 0} />
          <Metric label="Investor Questions" value={metrics?.counts.investor_questions ?? 0} />
          <Metric label="Survey Def Logs" value={metrics?.counts.survey_defs_logs ?? 0} />
        </div>

        {metrics?.collections?.length ? (
          <div className="rounded-2xl border bg-white p-4">
            <div className="text-sm font-medium mb-2">Collections (top 12)</div>
            <Table
              headers={["Collection", "Count"]}
              rows={metrics.collections.map((c) => [c.name, c.count])}
            />
          </div>
        ) : null}
      </section>

      <div className="text-xs text-gray-500">Last updated: {lastUpdated || "—"}</div>
    </div>
  );
}

/* ---------- UI bits ---------- */

function SummaryCard({
  title,
  status,
  lines,
}: {
  title: string;
  status: "ok" | "down" | string | boolean | undefined;
  lines: string[];
}) {
  const ok = status === "ok" || status === true;
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="font-semibold">{title}</div>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            ok ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}
        >
          {ok ? "OK" : "Down"}
        </span>
      </div>
      <div className="mt-2 text-sm text-gray-600 space-y-1">
        {lines.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
    </div>
  );
}

function Table({
  headers,
  rows,
}: {
  headers: (string | JSX.Element)[];
  rows: (Array<string | number | JSX.Element>)[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            {headers.map((h, i) => (
              <th key={i} className="py-2 pr-4">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b last:border-0">
              {r.map((c, j) => (
                <td key={j} className="py-2 pr-4 align-top">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="text-gray-600 text-sm">{label}</div>
      <div className="text-xl font-semibold mt-1">{String(value)}</div>
    </div>
  );
}
