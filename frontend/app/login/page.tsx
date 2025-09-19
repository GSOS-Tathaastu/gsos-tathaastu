"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const params = useSearchParams();
  const router = useRouter();
  const to = params.get("to") || "/";
  const area = params.get("area") || "admin";

  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ area, password }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j?.error || "Login failed");
      router.push(to);
    } catch (err: any) {
      setMsg(err?.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold">Restricted Access</h1>
        <p className="mt-1 text-sm text-gray-600">
          Enter password to access <span className="font-medium">{area}</span> area.
        </p>

        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              className="w-full rounded-xl border px-4 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoFocus
            />
          </div>

        <button
          type="submit"
          disabled={submitting || !password}
          className="w-full rounded-xl bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {submitting ? "Checking…" : "Continue"}
        </button>

          {msg && <div className="text-sm text-red-600">{msg}</div>}
        </form>

        <div className="mt-3 text-xs text-gray-500">
          You’ll remain signed in for 24 hours on this device.
        </div>
      </div>
    </div>
  );
}
