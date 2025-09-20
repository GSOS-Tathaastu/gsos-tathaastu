// frontend/app/investors/page.tsx
"use client";
import { useEffect, useState } from "react";
// import your existing InvestorsClient + key form or inline component

export default function InvestorsPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);

  async function check() {
    try {
      const r = await fetch("/api/investors/session", { cache: "no-store" });
      const j = await r.json();
      setAuthed(!!j.ok);
    } catch {
      setAuthed(false);
    }
  }

  useEffect(() => {
    check();
  }, []);

  if (authed === null) return <div className="p-6 text-gray-500">Checking access…</div>;

  return authed ? (
    // Your full investors UI here (PPT, forms, QA, negotiation, etc.)
    <div className="p-6">Investor portal</div>
  ) : (
    // Your key form (POST to /api/investors/auth then re-check)
    <KeyForm onSuccess={check} />
  );
}

function KeyForm({ onSuccess }: { onSuccess: () => void }) {
  const [key, setKey] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch("/api/investors/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      const j = await r.json();
      if (!j.ok) {
        setErr(j.error || "Invalid key");
      } else {
        onSuccess();
      }
    } catch (e: any) {
      setErr(e?.message || "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="max-w-sm mx-auto p-6 space-y-3">
      <h1 className="text-xl font-semibold">Investor Access</h1>
      <input
        value={key}
        onChange={(e) => setKey(e.target.value)}
        className="w-full border rounded-lg px-3 py-2"
        placeholder="Enter access key"
      />
      {err && <p className="text-red-600 text-sm">{err}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-indigo-600 text-white px-4 py-2"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
