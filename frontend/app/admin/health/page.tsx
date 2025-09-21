"use client";

import { useEffect, useState } from "react";
import SurveyAnalytics from "@/components/SurveyAnalytics";

type HealthResp = {
  ok: boolean;
  mongo?: { status?: string; error?: string | null };
  railway?: { status?: string };
  pages?: Array<{ path: string; ok: boolean; latency: number; error?: string }>;
  apis?: Array<{ path: string; status: string; latency: number; error?: string; body?: any }>;
};

export default function AdminHealthPage() {
  const [data, setData] = useState<HealthResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [openaiStatus, setOpenaiStatus] = useState<{
    ok: boolean;
    latency?: number;
    error?: string;
  }>({ ok: false });

  // Poll /api/admin/health every 15s (browser timers only)
  useEffect(() => {
    let mounted = true;
    let timer: number | undefined;

    async function load() {
      try {
        setErr(null);
        const r = await fetch("/api/admin/health", { cache: "no-store" });
        if (!r.ok) throw new Error(`health ${r.status}`);
        const j: HealthResp = await r.json();
        if (mounted) setData(j);
      } catch (e: any) {
        if (mounted) setErr(e?.message || "Failed to load");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    timer = window.setInterval(load, 15000);

    return () => {
      mounted = false;
      if (timer !== undefined) window.clearInterval(timer);
    };
  }, []);

  // Ping OpenAI once on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      const t0 = performance.now();
      try {
        const res = await fetch("/api/admin/openai-check", { cache: "no-store" });
        const body = await res.json();
        const t1 = performance.now();
        if (!mounted) return;
        setOpenaiStatus({
          ok: !!body?.ok,
          latency: Math.round(t1 - t0),
          error: body?.error,
        });
      } catch (e: any) {
        if (!mounted) return;
        setOpenaiStatus({ ok: false, error: e?.message });
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <div className="p-6">Loading health…</div>;
  if (err) return <div className="p-6 text-red-600">Error: {err}</div>;
  if (!data) return <div className="p-6">No data.</div>;

  return (
    <main className="max-w-6xl mx-auto px-6 py-10 space-y-10">
      <h1 className="text-3xl font-bold">System Health</h1>

      {/* Services status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <HealthCard title="Next.js API" status="OK" latency="—" ok={true} />
        <HealthCard
          title="MongoDB"
          status={data.mongo?.status === "connected" ? "OK" : "Down"}
          latency="—"
          ok={data.mongo?.status === "connected"}
          error={data.mongo?.error || undefined}
        />
        <HealthCard
          title="Railway Backend"
          status={data.railway?.status === "up" ? "OK" : "Down"}
          latency="—"
          ok={data.railway?.status === "up"}
        />
        <HealthCard
          title="OpenAI API"
          status={openaiStatus.ok ? "OK" : "Down"}
          latency={openaiStatus.latency ? `${openaiStatus.latency} ms` : "—"}
          ok={openaiStatus.ok}
          error={openaiStatus.error}
        />
      </div>

      {/* Pages status table */}
      {!!data.pages?.length && (
        <section>
          <h2 className="text-xl font-semibold mb-3">Pages</h2>
          <table className="w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border text-left">Path</th>
                <th className="p-2 border">Status</th>
                <th className="p-2 border">Latency</th>
                <th className="p-2 border">Error</th>
              </tr>
            </thead>
            <tbody>
              {data.pages.map((p, idx) => (
                <tr key={idx}>
                  <td className="border p-2">{p.path}</td>
                  <td className={`border p-2 ${p.ok ? "text-green-700" : "text-red-700"}`}>
                    {p.ok ? "OK" : "Down"}
                  </td>
                  <td className="border p-2">{p.latency} ms</td>
                  <td className="border p-2 text-gray-600">{p.error || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* APIs status table */}
      {!!data.apis?.length && (
        <section>
          <h2 className="text-xl font-semibold mb-3">APIs</h2>
          <table className="w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border text-left">Path</th>
                <th className="p-2 border">Status</th>
                <th className="p-2 border">Latency</th>
                <th className="p-2 border">Error / Body (short)</th>
              </tr>
            </thead>
            <tbody>
              {data.apis.map((a, idx) => (
                <tr key={idx}>
                  <td className="border p-2">{a.path}</td>
                  <td className={`border p-2 ${a.status === "OK" ? "text-green-700" : "text-red-700"}`}>
                    {a.status}
                  </td>
                  <td className="border p-2">{a.latency} ms</td>
                  <td className="border p-2 text-gray-600">
                    {a.error ? a.error : JSON.stringify(a.body || "").slice(0, 180)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Survey Analytics */}
      <section className="rounded-2xl border bg-white shadow-sm p-5">
        <h2 className="text-xl font-semibold mb-4">Survey Analytics</h2>
        <SurveyAnalytics />
      </section>
    </main>
  );
}

function HealthCard({
  title,
  status,
  latency,
  ok,
  error,
}: {
  title: string;
  status: string;
  latency: string;
  ok: boolean;
  error?: string;
}) {
  return (
    <div className="rounded-xl border p-4 shadow-sm bg-white">
      <h3 className="font-semibold">{title}</h3>
      <p className={ok ? "text-green-600" : "text-red-600"}>Status: {status}</p>
      <p className="text-sm text-gray-600">Latency: {latency}</p>
      {error && <p className="text-xs text-red-500 mt-1">Error: {error}</p>}
    </div>
  );
}
