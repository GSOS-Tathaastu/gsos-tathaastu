// frontend/components/InvestorForms.tsx
"use client";
import { useState } from "react";

export default function InvestorForms() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    amount: "",
    equity: "",
    question: "",
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    try {
      const r = await fetch("/api/investors/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Failed");
      setMsg(j.ok ? "Received. We’ll follow up by email." : "Saved.");
      setForm((s) => ({ ...s, amount: "", equity: "", question: "" }));
    } catch (e: any) {
      setMsg(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="border rounded-2xl p-4 space-y-3">
      <h2 className="text-lg font-semibold">Indicate Interest & Ask a Question</h2>
      <form onSubmit={submit} className="grid gap-3 md:grid-cols-2">
        <input
          className="p-2 rounded border"
          placeholder="Full name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          className="p-2 rounded border"
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <input
          className="p-2 rounded border"
          placeholder="Amount (e.g., USD 200,000)"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
        />
        <input
          className="p-2 rounded border"
          placeholder="Equity (%)"
          value={form.equity}
          onChange={(e) => setForm({ ...form, equity: e.target.value })}
        />
        <textarea
          className="md:col-span-2 p-2 rounded border min-h-[120px]"
          placeholder="Your question (product, GTM, traction, tech, etc.)"
          value={form.question}
          onChange={(e) => setForm({ ...form, question: e.target.value })}
        />
        <div className="md:col-span-2">
          <button
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-black text-white"
          >
            {loading ? "Submitting…" : "Submit"}
          </button>
          {msg && <span className="ml-3 text-sm">{msg}</span>}
        </div>
      </form>
    </section>
  );
}
