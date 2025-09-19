"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

export default function LoginClient() {
  const params = useSearchParams();
  const next = params.get("next") || "/";

  const [email, setEmail] = useState("");

  // Replace with your real login flow
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    // ...auth logic...
    window.location.href = next;
  }

  return (
    <main className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Login</h1>
      <form onSubmit={handleLogin} className="space-y-3">
        <input
          className="w-full border rounded p-2"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button className="bg-indigo-600 text-white rounded px-4 py-2">
          Continue
        </button>
      </form>
      <p className="text-sm text-gray-500">
        After login you’ll be redirected to: <span className="font-mono">{next}</span>
      </p>
      <Link href="/">Back to home</Link>
    </main>
  );
}
