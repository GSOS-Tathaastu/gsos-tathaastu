"use client";

import { useState } from "react";

export default function DealNegotiator() {
  const [offer, setOffer] = useState("250000");
  const [equity, setEquity] = useState("5");
  const [note, setNote] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    setResult(null);
    try {
      const r = await fetch("/api/investors/negotiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offerUsd: Number(offer),
          equityPct: Number(equity),
          note: note || "",
        }),
      });
      const j = await r.json();
      setResult(j?.proposal || j?.note || "No proposal returned.");
    } catch {
      setResult("Could not negotiate right now; please try again later.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid sm:grid-cols-3 gap-3">
        <input className="rounded-xl border px-3 py-2" placeholder="Offer amount (USD)" value={offer} onChange={e=>setOffer(e.target.value)} />
        <input className="rounded-xl border px-3 py-2" placeholder="Equity (%)" value={equity} onChange={e=>setEquity(e.target.value)} />
        <input className="rounded-xl border px-3 py-2" placeholder="Notes (optional)" value={note} onChange={e=>setNote(e.target.value)} />
      </div>
      <button onClick={run} disabled={busy} className="rounded-xl bg-black text-white px-5 py-2 hover:bg-gray-900 disabled:opacity-60">
        {busy ? "Calculating…" : "Propose"}
      </button>
      {result && <div className="rounded-xl border p-3 bg-gray-50 whitespace-pre-wrap text-sm">{result}</div>}
    </div>
  );
}
