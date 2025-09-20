"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [key, setKey] = useState("");
  const [err, setErr] = useState("");
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const r = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });
    const j = await r.json();
    if (j.ok) router.push("/admin");
    else setErr(j.error || "Auth failed");
  }

  return (
    <main className="max-w-md mx-auto mt-20 p-6 bg-white rounded-xl shadow">
      <h1 className="text-2xl font-bold mb-4 text-center">Admin Login</h1>
      <form onSubmit={submit} className="space-y-4">
        <input
          type="password"
          placeholder="Enter Admin Key"
          className="w-full border rounded px-3 py-2"
          value={key}
          onChange={(e) => setKey(e.target.value)}
        />
        {err && <div className="text-red-600 text-sm">{err}</div>}
        <button className="w-full bg-indigo-600 text-white rounded py-2 hover:bg-indigo-700">
          Sign in
        </button>
      </form>
    </main>
  );
}
