"use client";

import { useEffect, useState } from "react";

/** ---------- Types ---------- */
type Settings = {
  forceLocalChunks?: boolean;
  updatedAt?: string;
};

type ChunkSummary = {
  ok: boolean;
  source: "db" | "local" | "unknown" | "error";
  count: number;
  sample: { id?: string; title?: string; size?: number; tags?: string[] }[];
  latencyMs: number;
  error?: string;
};

/** ---------- Helpers ---------- */
async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: "include", cache: "no-store", ...init });
  const txt = await res.text();
  const data = txt ? JSON.parse(txt) : ({} as any);
  if (!res.ok || data?.ok === false) {
    const msg = data?.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}

/** ---------- Page ---------- */
export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>({});
  const [summary, setSummary] = useState<ChunkSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  async function loadAll() {
    setLoading(true);
    setErr(null);
    setOkMsg(null);
    try {
      const [s, sum] = await Promise.all([
        fetchJson<{ ok: true; settings: Settings }>("/api/admin/settings"),
        fetchJson<ChunkSummary>("/api/admin/chunks/summary"),
      ]);
      setSettings(s.settings || {});
      setSummary(sum);
    } catch (e: any) {
      setErr(e?.message || "Failed to load admin settings");
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setSaving(true);
    setErr(null);
    setOkMsg(null);
    try {
      const saved = await fetchJson<{ ok: true; settings: Settings }>("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forceLocalChunks: !!settings.forceLocalChunks }),
      });
      setSettings(saved.settings || {});
      setOkMsg("Saved.");
      // refresh summary to reflect new source
      const sum = await fetchJson<ChunkSummary>("/api/admin/chunks/summary");
      setSummary(sum);
    } catch (e: any) {
      setErr(e?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Admin Settings</h1>

      {/* Toggle card */}
      <section className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="text-lg font-semibold">Use Local JSON Chunks</div>
            <p className="text-sm text-gray-600 mt-1">
              When enabled, question generation reads <code>/data/*.json</code> instead of the{" "}
              <code>chunks</code> collection in MongoDB.
            </p>
            {settings?.updatedAt && (
              <p className="text-xs text-gray-500 mt-1">
                Last updated: {new Date(settings.updatedAt).toLocaleString()}
              </p>
            )}
          </div>

          {/* Switch */}
          <label className="inline-flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              className="sr-only"
              checked={!!settings.forceLocalChunks}
              onChange={(e) => setSettings((s) => ({ ...s, forceLocalChunks: e.target.checked }))}
            />
            <span
              className={`w-12 h-7 flex items-center rounded-full p-1 transition ${
                settings.forceLocalChunks ? "bg-indigo-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`bg-white w-5 h-5 rounded-full shadow transform transition ${
                  settings.forceLocalChunks ? "translate-x-5" : ""
                }`}
              />
            </span>
          </label>
        </div>

        <div className="flex gap-3">
          <button
            onClick={save}
            disabled={saving}
            className="rounded bg-indigo-600 text-white px-4 py-2 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            onClick={loadAll}
            className="rounded border px-4 py-2 hover:bg-gray-50"
          >
            Reload
          </button>
        </div>

        {okMsg && <div className="text-green-700 text-sm">{okMsg}</div>}
        {err && <div className="text-red-700 text-sm">{err}</div>}
      </section>

      {/* Chunks summary card */}
      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Chunks Summary</h2>
          <button
            onClick={async () => {
              try {
                const sum = await fetchJson<ChunkSummary>("/api/admin/chunks/summary");
                setSummary(sum);
              } catch (e: any) {
                setErr(e?.message || "Failed to refresh chunks summary");
              }
            }}
            className="text-sm rounded border px-3 py-1 hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-gray-600 mt-2">Loading…</p>
        ) : summary ? (
          summary.ok ? (
            <div className="mt-3 space-y-2">
              <p className="text-sm">
                <b>Source:</b> <span className="uppercase">{summary.source}</span>
              </p>
              <p className="text-sm">
                <b>Total Chunks:</b> {summary.count}
              </p>
              <p className="text-xs text-gray-500">Latency: {summary.latencyMs} ms</p>

              <details className="mt-2">
                <summary className="cursor-pointer text-sm">Sample (first {summary.sample.length})</summary>
                <ul className="list-disc ml-6 mt-2 text-sm">
                  {summary.sample.map((s, i) => (
                    <li key={i}>
                      <span className="font-medium">{s.title || s.id || "Untitled"}</span>
                      <span className="text-gray-500"> — {s.size || 0} chars</span>
                      {s.tags?.length ? (
                        <span className="ml-2 text-gray-500">[{s.tags.join(", ")}]</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          ) : (
            <div className="text-red-700 text-sm mt-2">Error: {summary.error || "Unknown error"}</div>
          )
        ) : (
          <p className="text-sm text-gray-600 mt-2">No summary available.</p>
        )}
      </section>
    </main>
  );
}
