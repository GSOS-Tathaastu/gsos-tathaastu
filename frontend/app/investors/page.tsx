"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function InvestorLoginPage() {
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/investors/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });
    const data = await res.json();
    if (data.ok) {
      router.push("/investors/dashboard");
    } else {
      setError(data.error || "Auth failed");
    }
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-6 rounded-xl shadow bg-white">
      <h1 className="text-2xl font-bold mb-4 text-center">Investor Access</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="password"
          placeholder="Enter Investor Key"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
        >
          Enter
        </button>
      </form>
    </div>
  );
}
