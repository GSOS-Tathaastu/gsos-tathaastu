"use client";

import { useEffect, useState } from "react";
import { Grid, HealthCard } from "@/components/HealthGrid";
import { FlowCanvas } from "@/components/FlowCanvas";

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

type Metrics = {
  ok: boolean;
  latencyMs: number;
  hasDb: boolean;
  counts: { submissions: number; companies: number; chunks: number };
  collections: { name: string; count: number }[];
  dbStats: any;
  runtime: { node: string; vercel: boolean; uptimeSec: number; pid: number };
  ts: string;
};

export default function AdminHealthPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  async function refresh() {
    try {
      const [h, m] = await Promise.all([
        fetch("/api/health", { cache: "no-store" }).then(r => r.json()),
        fetch("/api/admin/metrics", { cache: "no-store" }).then(r => r.json()),
      ]);
      setHealth(h);
      setMetrics(m);
      setLastUpdated(new Date().toLocaleString());
    } catch {}
  }

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 10000);
    return () => clearInterval(id);
  }, []);

  const backendOk = !!(health?.checks.backend?.ok);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">System Health</h1>
        <button onClick={refresh} className="px-4 py-2 rounded-xl bg-black text-white">Refresh</button>
      </div>

      <FlowCanvas
        statuses={{
          browser: "ok",
          next: "ok",
          mongo: health?.checks.mongo.ok ? "ok" : "down",
          backend: backendOk ? "ok" : "down",
        }}
      />

      <Grid>
        <HealthCard
          title="Next.js API"
          status="ok"
          latency={health?.latencyMs}
          details={health ? `node=${health.runtime.node} vercel=${health.runtime.vercel}` : "…"}
        />
        <HealthCard
          title="MongoDB"
          status={health?.checks.mongo.ok ? "ok" : (health ? "degraded" : "down")}
          details={health?.checks.mongo.message}
        />
        <HealthCard
          title="Railway Backend"
          status={backendOk ? "ok" : "down"}
          latency={(health?.checks.backend as any)?.latencyMs}
          details={
            (health?.checks.backend as any)?.error
              ? (health?.checks.backend as any).error
              : JSON.stringify((health?.checks.backend as any)?.body ?? {}, null, 2).slice(0, 160)
          }
        />
      </Grid>

      {/* Pages table */}
      <section className="space-y-2">
        <h2 className="text-lg font-semibold mt-6">Pages</h2>
        <div className="rounded-2xl border bg-white p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">Path</th><th>Status</th><th>Latency</th><th>Error</th>
              </tr>
            </thead>
            <tbody>
              {health?.checks.pages?.map((p, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-2">{p.path}</td>
                  <td>{p.ok ? "OK" : p.status}</td>
                  <td>{p.latencyMs} ms</td>
                  <td className="text-red-600">{p.error || ""}</td>
                </tr>
              )) || null}
            </tbody>
          </table>
        </div>
      </section>

      {/* APIs table */}
      <section className="space-y-2">
        <h2 className="text-lg font-semibold mt-6">APIs</h2>
        <div className="rounded-2xl border bg-white p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">Path</th><th>Status</th><th>Latency</th><th>Error / Body (short)</th>
              </tr>
            </thead>
            <tbody>
              {health?.checks.apis?.map((p, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-2">{p.path}</td>
                  <td>{p.ok ? "OK" : p.status}</td>
                  <td>{p.latencyMs} ms</td>
                  <td className="max-w-[560px] overflow-hidden text-ellipsis whitespace-nowrap">
                    {p.error ? <span className="text-red-600">{p.error}</span> : JSON.stringify(p.body).slice(0, 160)}
                  </td>
                </tr>
              )) || null}
            </tbody>
          </table>
        </div>
      </section>

      {/* Metrics */}
      <section className="space-y-2">
        <h2 className="text-lg font-semibold mt-6">Metrics</h2>
        <div className="rounded-2xl border bg-white p-4 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Metric label="Surveys" value={metrics?.counts.submissions ?? 0} />
            <Metric label="Companies" value={metrics?.counts.companies ?? 0} />
            <Metric label="Chunks" value={metrics?.counts.chunks ?? 0} />
            <Metric label="DB Connected" value={metrics?.hasDb ? "Yes" : "No"} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Metric label="RSS" value={`${metrics?.runtime ? (metrics as any)?.memory?.rssMB || "" : ""}`} />
            <Metric label="Uptime" value={`${metrics?.runtime?.uptimeSec ?? 0}s`} />
            <Metric label="Node" value={metrics?.runtime?.node ?? ""} />
            <Metric label="PID" value={`${metrics?.runtime?.pid ?? ""}`} />
          </div>

          {metrics?.collections?.length ? (
            <div>
              <div className="font-medium mb-2">Collections (top 12)</div>
              <ul className="list-disc pl-6 text-sm">
                {metrics.collections.map((c, i) => (
                  <li key={i}>{c.name}: {c.count}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </section>

      <div className="text-xs text-gray-500">Last updated: {lastUpdated || "—"}</div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-xl border p-3 text-sm">
      <div className="text-gray-600">{label}</div>
      <div className="text-lg font-semibold">{String(value)}</div>
    </div>
  );
}
