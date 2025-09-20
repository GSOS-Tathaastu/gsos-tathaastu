"use client";

import { useEffect, useState } from "react";

type HealthOut = {
  next: { ok: boolean; latencyMs: number; node: string; vercel: boolean };
  mongo: { status: string; error: string | null };
  railway: { status: string; note?: string };
  pages: Array<{ path: string; status: string; latency: number; error?: string }>;
  apis: Array<{ path: string; status: string; latency: number; bodyShort?: string }>;
  metrics: {
    companies: number;
    submissions: number;
    submissions7d: number;
    sessions: number;
    chunks: number;
    investorIntents: number;
    investorQuestions: number;
    surveyDefLogs: number;
  };
  updatedAt: string;
};

export default function AdminHealthPage() {
  const [data, setData] = useState<HealthOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      const json = await res.json();
      setData(json);
    } catch (e: any) {
      setErr(e?.message || "Failed to fetch /api/health");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">System Health</h1>
        <button
          onClick={load}
          className="rounded bg-black text-white px-4 py-2 hover:bg-gray-800"
        >
          Refresh
        </button>
      </div>

      {err && <div className="text-red-600">Error: {err}</div>}
      {loading && <div className="opacity-80">Loading…</div>}

      {data && (
        <>
          {/* Top cards */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border p-4">
              <div className="text-sm text-gray-600">Next.js API</div>
              <div className="mt-1">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                    data.next.ok
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {data.next.ok ? "OK" : "Down"}
                </span>
              </div>
              <div className="text-sm mt-2">
                Latency: {data.next.latencyMs || 0} ms
              </div>
              <div className="text-xs text-gray-500">
                node={data.next.node} vercel={String(data.next.vercel)}
              </div>
            </div>

            <div className="rounded-xl border p-4">
              <div className="text-sm text-gray-600">MongoDB</div>
              <div className="mt-1">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                    data.mongo.status === "connected"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {data.mongo.status}
                </span>
              </div>
              {data.mongo.error && (
                <div className="text-xs text-red-600 mt-2">{data.mongo.error}</div>
              )}
            </div>

            <div className="rounded-xl border p-4">
              <div className="text-sm text-gray-600">Railway Backend</div>
              <div className="mt-1">
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs bg-red-100 text-red-800">
                  {data.railway.status || "Down"}
                </span>
              </div>
              {data.railway.note && (
                <div className="text-xs text-gray-600 mt-2">{data.railway.note}</div>
              )}
            </div>
          </section>

          {/* Pages */}
          <section>
            <h2 className="text-xl font-semibold mt-4 mb-2">Pages</h2>
            <div className="overflow-auto rounded-xl border">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3">Path</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Latency</th>
                    <th className="text-left p-3">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.pages || []).map((p, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="p-3">{p.path}</td>
                      <td className="p-3">{p.status}</td>
                      <td className="p-3">{p.latency} ms</td>
                      <td className="p-3 text-red-600">{p.error || ""}</td>
                    </tr>
                  ))}
                  {(!data.pages || data.pages.length === 0) && (
                    <tr className="border-t">
                      <td className="p-3" colSpan={4}>
                        <em>No page checks returned.</em>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* APIs */}
          <section>
            <h2 className="text-xl font-semibold mt-6 mb-2">APIs</h2>
            <div className="overflow-auto rounded-xl border">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3">Path</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Latency</th>
                    <th className="text-left p-3">Error / Body (short)</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.apis || []).map((a, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="p-3">{a.path}</td>
                      <td className="p-3">{a.status}</td>
                      <td className="p-3">{a.latency} ms</td>
                      <td className="p-3">{a.bodyShort || ""}</td>
                    </tr>
                  ))}
                  {(!data.apis || data.apis.length === 0) && (
                    <tr className="border-t">
                      <td className="p-3" colSpan={4}>
                        <em>No API checks returned.</em>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Metrics */}
          <section>
            <h2 className="text-xl font-semibold mt-6 mb-2">Database Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.entries(data.metrics || {}).map(([k, v]) => (
                <div key={k} className="rounded-xl border p-4">
                  <div className="text-sm text-gray-600">{labelize(k)}</div>
                  <div className="text-2xl font-bold mt-1">{v as any}</div>
                </div>
              ))}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Last updated: {new Date(data.updatedAt).toLocaleString()}
            </div>
          </section>
        </>
      )}
    </main>
  );
}

function labelize(s: string) {
  return s
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}
