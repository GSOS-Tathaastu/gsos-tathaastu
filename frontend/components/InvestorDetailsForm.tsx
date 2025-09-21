"use client";

import { useState } from "react";

export default function InvestorDetailsForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [equity, setEquity] = useState<string>("");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    try {
      // Send to your existing admin mailer or a new endpoint if you prefer
      await fetch("/api/mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: "Investor Interest",
          html: `
            <h3>Investor Interest</h3>
            <p><b>Name:</b> ${name || "—"}</p>
            <p><b>Email:</b> ${email || "—"}</p>
            <p><b>Amount:</b> ${amount || "—"}</p>
            <p><b>Equity:</b> ${equity || "—"}</p>
            <p><b>Note:</b> ${note || "—"}</p>
          `,
        }),
      });
      setMsg("Thanks — we’ve received your interest.");
      setName(""); setEmail(""); setAmount(""); setEquity(""); setNote("");
    } catch {
      setMsg("Could not submit right now. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <input className="rounded-xl border px-3 py-2" placeholder="Name (optional)" value={name} onChange={e=>setName(e.target.value)} />
      <input className="rounded-xl border px-3 py-2" placeholder="Email (optional)" value={email} onChange={e=>setEmail(e.target.value)} />
      <input className="rounded-xl border px-3 py-2" placeholder="Amount willing to invest (USD)" value={amount} onChange={e=>setAmount(e.target.value)} />
      <input className="rounded-xl border px-3 py-2" placeholder="Equity you expect (%)" value={equity} onChange={e=>setEquity(e.target.value)} />
      <textarea className="rounded-xl border px-3 py-2 sm:col-span-2" rows={4} placeholder="Notes / Preferences (optional)" value={note} onChange={e=>setNote(e.target.value)} />
      <div className="sm:col-span-2 flex items-center gap-3">
        <button disabled={busy} className="rounded-xl bg-black text-white px-5 py-2 hover:bg-gray-900 disabled:opacity-60">Submit</button>
        {msg && <div className="text-sm text-gray-600">{msg}</div>}
      </div>
    </form>
  );
}
