// frontend/app/admin/chunks/page.tsx
"use client";

import { useEffect, useState } from "react";

type Summary = {
  ok: boolean;
  error?: string;
  note?: string;
  count: number;
  sample: Array<{ _id: string; docId?: string; title?: string; page?: number; size?: number; updatedAt?: string }>;
  collStats?: any;
  latencyMs: number;
};

export default function AdminChunksPage() {
  const [data, setData] = useState<Summary | null>(null);
  const [refTime, setRefTime] = useState("");

  async function refresh() {
    const res = await fetch("/api/admin/chunks/summary", { cache: "no-store" });
    const j = await res.json();
    setData(j);
    setRefTime(new Date().toLocaleString());
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Chunks</h1>
      <button onClick={refresh} className="px-4 py-2 rounded-xl bg-black text-white">Refresh</button>

      {data?.error && <div className="text-red-600">{data.error}</div>}
      {data?.note && <div className="text-gray-600">{data.note}</div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Metric label="Total chunks" value={data?.count ?? 0} />
        <Metric label="Latency" value={(data?.latencyMs ?? 0) + " ms"} />
        <Metric label="Last updated" value={refTime || "—"} />
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Recent (10)</h2>
        <div className="rounded-2xl border bg-white p-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">_id</th><th>docId</th><th>title</th><th>page</th><th>size</th><th>updatedAt</th>
              </tr>
            </thead>
            <tbody>
              {data?.sample?.map((s: any) => (
                <tr key={s._id} className="border-b last:border-0">
                  <td className="py-2">{String(s._id)}</td>
                  <td>{s.docId || ""}</td>
                  <td className="max-w-[360px] overflow-hidden text-ellipsis whitespace-nowrap">{s.title || ""}</td>
                  <td>{s.page ?? ""}</td>
                  <td>{s.size ?? ""}</td>
                  <td>{s.updatedAt ? new Date(s.updatedAt).toLocaleString() : ""}</td>
                </tr>
              )) || null}
            </tbody>
          </table>
        </div>
      </section>
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
