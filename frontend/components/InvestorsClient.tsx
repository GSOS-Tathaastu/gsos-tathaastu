// frontend/components/InvestorsClient.tsx
"use client";

import { useEffect, useState } from "react";
import InvestorBenchmarks from "@/components/InvestorBenchmarks";

export default function InvestorsClient() {
  const [authed, setAuthed] = useState<boolean>(false);
  const [key, setKey] = useState("");

  // Q&A
  const [q, setQ] = useState("");
  const [a, setA] = useState("");
  const [busyQA, setBusyQA] = useState(false);

  // Investor intent / submit
  const [name, setName] = useState("");
  const [org, setOrg] = useState("");
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [equity, setEquity] = useState("");
  const [notes, setNotes] = useState("");
  const [submitMsg, setSubmitMsg] = useState("");

  // Negotiate
  const [offerTicket, setOfferTicket] = useState("$250k");
  const [offerEquity, setOfferEquity] = useState("2%");
  const [stage, setStage] = useState("Pre-seed");
  const [context, setContext] = useState("India↔GCC corridors, efficiency focus");
  const [counter, setCounter] = useState("");
  const [busyNeg, setBusyNeg] = useState(false);

  // On mount, do a quick ping via protected endpoint to see if cookie already set
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/investors/data", { method: "GET" });
        setAuthed(r.ok);
      } catch {
        setAuthed(false);
      }
    })();
  }, []);

  async function login() {
    setAuthed(false);
    try {
      const r = await fetch("/api/investors/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      const j = await r.json();
      if (r.ok && j.ok) setAuthed(true);
      else alert(j.error || "Invalid key");
    } catch (e: any) {
      alert(e?.message || "Auth failed");
    }
  }

  async function askQA() {
    setBusyQA(true);
    setA("");
    try {
      const r = await fetch("/api/investors/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || "qa_failed");
      setA(j.answer || "");
    } catch (e: any) {
      setA(`Error: ${e.message}`);
    } finally {
      setBusyQA(false);
    }
  }

  async function submitIntent() {
    setSubmitMsg("");
    try {
      const r = await fetch("/api/investors/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, amount, equity, notes }),
      });
      const j = await r.json();
      if (!r.ok || j.error) throw new Error(j.error || "submit_failed");
      setSubmitMsg(`Saved ✓ (id: ${j.id})`);
    } catch (e: any) {
      setSubmitMsg(`Error: ${e.message}`);
    }
  }

  async function runNegotiate() {
    setBusyNeg(true);
    setCounter("");
    try {
      const r = await fetch("/api/investors/negotiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          investor: { name, org, email },
          offer: { ticket: offerTicket, equity: offerEquity },
          stage,
          context,
        }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || "negotiate_failed");
      setCounter(j.counter || "");
    } catch (e: any) {
      setCounter(`Error: ${e.message}`);
    } finally {
      setBusyNeg(false);
    }
  }

  if (!authed) {
    return (
      <section className="rounded-2xl border bg-white shadow p-6 space-y-3">
        <h2 className="text-xl font-semibold">Investor Access</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            className="border rounded px-3 py-2 flex-1"
            placeholder="Access key"
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
          <button
            onClick={login}
            className="rounded bg-indigo-600 text-white px-4 py-2"
          >
            Enter
          </button>
        </div>
        <p className="text-sm text-gray-500">
          Use the secure key (server-validated) to unlock Q&A, benchmarks and negotiation.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-8">
      {/* Q&A box */}
      <section className="rounded-2xl border bg-white shadow p-6 space-y-3">
        <h2 className="text-xl font-semibold">Q&A (from GSOS materials)</h2>
        <textarea
          className="w-full border rounded px-3 py-2 min-h-[100px]"
          placeholder="Ask about GSOS…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button
          onClick={askQA}
          disabled={busyQA}
          className="rounded bg-gray-900 text-white px-4 py-2"
        >
          {busyQA ? "Thinking…" : "Ask"}
        </button>
        {a && <div className="text-sm whitespace-pre-wrap rounded bg-gray-50 p-3">{a}</div>}
      </section>

      {/* Deal benchmarking (separate chat) */}
      <InvestorBenchmarks />

      {/* Investor details + intent */}
      <section className="rounded-2xl border bg-white shadow p-6 space-y-3">
        <h3 className="text-lg font-semibold">Your Investment Intent</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input className="border rounded px-3 py-2" placeholder="Your name"
                 value={name} onChange={(e) => setName(e.target.value)} />
          <input className="border rounded px-3 py-2" placeholder="Organization (optional)"
                 value={org} onChange={(e) => setOrg(e.target.value)} />
          <input className="border rounded px-3 py-2" placeholder="Email"
                 value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="border rounded px-3 py-2" placeholder="Ticket (e.g., $250k)"
                 value={amount} onChange={(e) => setAmount(e.target.value)} />
          <input className="border rounded px-3 py-2" placeholder="Equity (e.g., 2%)"
                 value={equity} onChange={(e) => setEquity(e.target.value)} />
          <input className="border rounded px-3 py-2 md:col-span-2" placeholder="Notes"
                 value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <button onClick={submitIntent} className="rounded bg-indigo-600 text-white px-4 py-2">
          Save Intent
        </button>
        {submitMsg && <p className="text-sm">{submitMsg}</p>}
      </section>

      {/* Negotiate (with comps) */}
      <section className="rounded-2xl border bg-white shadow p-6 space-y-3">
        <h3 className="text-lg font-semibold">Negotiate with Comparable Deals</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input className="border rounded px-3 py-2" placeholder="Offer ticket (e.g., $250k)"
                 value={offerTicket} onChange={(e) => setOfferTicket(e.target.value)} />
          <input className="border rounded px-3 py-2" placeholder="Offer equity (e.g., 2%)"
                 value={offerEquity} onChange={(e) => setOfferEquity(e.target.value)} />
          <input className="border rounded px-3 py-2" placeholder="Stage"
                 value={stage} onChange={(e) => setStage(e.target.value)} />
          <input className="border rounded px-3 py-2 md:col-span-3" placeholder="Context"
                 value={context} onChange={(e) => setContext(e.target.value)} />
        </div>
        <button onClick={runNegotiate} disabled={busyNeg} className="rounded bg-emerald-600 text-white px-4 py-2">
          {busyNeg ? "Computing counter…" : "Propose Counter"}
        </button>
        {counter && <div className="text-sm whitespace-pre-wrap rounded bg-gray-50 p-3">{counter}</div>}
      </section>
    </div>
  );
}
