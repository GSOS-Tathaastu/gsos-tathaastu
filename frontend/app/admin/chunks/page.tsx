// frontend/app/admin/chunks/page.tsx
"use client";

import { useState } from "react";

type Row = { id?: string; title?: string; text: string; tags?: string[] | string };

export default function AdminChunksUploadPage() {
  const [mode, setMode] = useState<"append" | "replace">("append");
  const [rows, setRows] = useState<Row[]>([]);
  const [preview, setPreview] = useState<string>("No file loaded");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function parseCSV(csv: string): Row[] {
    // Very simple CSV: id,title,text,tags
    const lines = csv.split(/\r?\n/).filter(Boolean);
    if (!lines.length) return [];

    const header = lines[0].split(",").map((s) => s.trim());
    const idx = (name: string) => header.findIndex((h) => h.toLowerCase() === name);

    const iId = idx("id");
    const iTitle = idx("title");
    const iText = idx("text");
    const iTags = idx("tags");

    const out: Row[] = [];
    for (let l = 1; l < lines.length; l++) {
      const cols = lines[l].split(",");
      const r: Row = {
        id: iId >= 0 ? cols[iId]?.trim() : undefined,
        title: iTitle >= 0 ? cols[iTitle]?.trim() : undefined,
        text: iText >= 0 ? cols[iText]?.trim() : "",
        tags: iTags >= 0 ? cols[iTags]?.trim() : undefined,
      };
      if (r.text) out.push(r);
    }
    return out;
  }

  async function handleFile(f: File) {
    setError(null);
    setResult(null);

    const text = await f.text();
    let parsed: Row[] = [];

    try {
      if (f.name.endsWith(".csv")) {
        parsed = parseCSV(text);
      } else {
        const obj = JSON.parse(text);
        const arr = Array.isArray(obj) ? obj : obj?.chunks;
        parsed = Array.isArray(arr) ? arr : [];
      }
    } catch (e: any) {
      setError("Failed to parse file: " + (e.message || String(e)));
      return;
    }

    setRows(parsed);
    setPreview(`Loaded ${parsed.length} chunks from ${f.name}`);
  }

  async function onSubmit() {
    if (!rows.length) {
      setError("Nothing to upload");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/admin/chunks/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ mode, chunks: rows }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Upload failed");
      setResult(data);
    } catch (e: any) {
      setError(e.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Upload Chunks</h1>

      <div className="mb-4 text-sm text-gray-600">
        <p>Accepted formats:</p>
        <ul className="list-disc ml-5">
          <li><code>JSON</code> with <code>[{{id?, title?, text, tags?}}]</code> or <code>{{chunks:[...]}}</code></li>
          <li><code>CSV</code> with headers: <code>id,title,text,tags</code> (tags can be comma/pipe separated)</li>
        </ul>
      </div>

      <div className="flex gap-2 items-center mb-4">
        <label className="text-sm">Mode:</label>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as any)}
          className="border rounded px-3 py-2"
        >
          <option value="append">Append / Upsert by id</option>
          <option value="replace">Replace all (dangerous)</option>
        </select>
      </div>

      <div className="mb-4">
        <input
          type="file"
          accept=".json,.csv"
          onChange={(e) => e.target.files && handleFile(e.target.files[0])}
          className="block"
        />
        <p className="text-sm text-gray-500 mt-2">{preview}</p>
      </div>

      {rows.length > 0 && (
        <div className="mb-4 text-sm">
          <details>
            <summary className="cursor-pointer select-none">Preview first 2 rows</summary>
            <pre className="bg-gray-50 p-3 rounded mt-2 text-xs overflow-x-auto">
{JSON.stringify(rows.slice(0, 2), null, 2)}
            </pre>
          </details>
        </div>
      )}

      {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
      {result && (
        <div className="text-sm bg-green-50 border border-green-200 p-3 rounded mb-2">
          <div><b>Mode:</b> {result.mode}</div>
          <div><b>Inserted:</b> {result.inserted} | <b>Upserted:</b> {result.upserted} / {result.total}</div>
          {result.errors?.length ? (
            <details className="mt-2">
              <summary className="cursor-pointer">Errors ({result.errors.length})</summary>
              <pre className="text-xs">{result.errors.join("\n")}</pre>
            </details>
          ) : null}
        </div>
      )}

      <button
        onClick={onSubmit}
        disabled={loading || !rows.length}
        className="rounded bg-indigo-600 text-white px-4 py-2 disabled:opacity-50"
      >
        {loading ? "Uploading..." : "Upload"}
      </button>
    </div>
  );
}
