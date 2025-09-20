// frontend/app/admin/health/page.tsx
"use client";

import { useEffect, useState } from "react";

/** Inline tabs so this page is self-contained */
function AdminTabs({ active }: { active: "health" | "metrics" }) {
  const base =
    "px-3 py-1.5 rounded-lg text-sm font-medium transition border";
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

type PageCheck = { path: string; status: string; latency: number; error?: string };
type ApiCheck  = { path: string; status: string; latency: number; bodyShort?: string };

type HealthPayload = {
  ok: boolean;
  meta?: { node?: string; vercel?: boolean };
  next?: { ok: boolean; latency: number };
  mongo?: { ok: boolean; note?: string };
  backend?: { ok: boolean; note?: string };
  pages?: PageCheck[];
  apis?: ApiCheck[];
  lastUpdated?: string;
  error?: string;
};

export default function AdminHealthPage() {
  const [data, setData] = useState<HealthPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setErr(null);
      const res = await fetch("/api/health", { cache: "no-store" });
      const json = (await res.json()) as HealthPayload;
      setData(json);
    } catch (e: any) {
      setErr(e?.message || "Failed to load health");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-3">System Health</h1>
      <AdminTabs active="health" />

      <div className="mb-4">
        <button
          onClick={load}
          className="rounded-lg bg-black text-white px-4 py-2 hover:bg-gray-800"
        >
          Refresh
        </button>
      </div>

      {loading && <p className="text-gray-500">Checking systems…</p>}
      {err && <p className="text-red-600">Error: {err}</p>}

      {data && (
        <div className="space-y-8">
          {/* Status cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Next.js API */}
            <div className="rounded-xl border p-4">
              <div className="font-semibold mb-1">Next.js API</div>
              <div className="text-sm">
                Status:{" "}
                <span className={data.next?.ok ? "text-green-600" : "text-red-600"}>
                  {data.next?.ok ? "OK" : "Down"}
                </span>
              </div>
              <div className="text-sm">Latency: {data.next?.latency ?? "—"} ms</div>
              <div className="text-xs text-gray-500">
                node={data.meta?.node ?? "?"} vercel={String(data.meta?.vercel ?? false)}
              </div>
            </div>

            {/* MongoDB */}
            <div className="rounded-xl border p-4">
              <div className="font-semibold mb-1">MongoDB</div>
              <div className="text-sm">
                Status:{" "}
                <span className={data.mongo?.ok ? "text-green-600" : "text-red-600"}>
                  {data.mongo?.ok ? "OK" : "Down"}
                </span>
              </div>
              <div className="text-xs text-gray-500">{data.mongo?.note || "—"}</div>
            </div>

            {/* Railway / Backend */}
            <div className="rounded-xl border p-4">
              <div className="font-semibold mb-1">Railway Backend</div>
              <div className="text-sm">
                Status:{" "}
                <span className={data.backend?.ok ? "text-green-600" : "text-red-600"}>
                  {data.backend?.ok ? "OK" : "Down"}
                </span>
              </div>
              <div className="text-xs text-gray-500">{data.backend?.note || "—"}</div>
            </div>
          </div>

          {/* Pages table */}
          <section>
            <h2 className="font-semibold mb-2">Pages</h2>
            <div className="overflow-auto rounded-xl border">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2">Path</th>
                    <th className="text-left px-3 py-2">Status</th>
                    <th className="text-left px-3 py-2">Latency</th>
                    <th className="text-left px-3 py-2">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.pages ?? []).map((p) => (
                    <tr key={p.path} className="border-t">
                      <td className="px-3 py-2">{p.path}</td>
                      <td className="px-3 py-2">{p.status}</td>
                      <td className="px-3 py-2">{p.latency} ms</td>
                      <td className="px-3 py-2 text-gray-600">{p.error || ""}</td>
                    </tr>
                  ))}
                  {(data.pages ?? []).length === 0 && (
                    <tr>
                      <td className="px-3 py-3 text-gray-500" colSpan={4}>
                        No page checks reported.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* APIs table */}
          <section>
            <h2 className="font-semibold mb-2">APIs</h2>
            <div className="overflow-auto rounded-xl border">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2">Path</th>
                    <th className="text-left px-3 py-2">Status</th>
                    <th className="text-left px-3 py-2">Latency</th>
                    <th className="text-left px-3 py-2">Error / Body (short)</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.apis ?? []).map((a) => (
                    <tr key={a.path} className="border-t">
                      <td className="px-3 py-2">{a.path}</td>
                      <td className="px-3 py-2">{a.status}</td>
                      <td className="px-3 py-2">{a.latency} ms</td>
                      <td className="px-3 py-2 text-gray-600">{a.bodyShort || ""}</td>
                    </tr>
                  ))}
                  {(data.apis ?? []).length === 0 && (
                    <tr>
                      <td className="px-3 py-3 text-gray-500" colSpan={4}>
                        No API checks reported.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <div className="text-xs text-gray-500">
            Last updated: {data.lastUpdated || "—"}
          </div>
        </div>
      )}
    </div>
  );
}
