"use client";

import { useState } from "react";

type Match = {
  investor?: string;
  company?: string;
  stage?: string;
  ticket?: number;
  equity?: number | string;
  date?: string;
  notes?: string;
  source?: string;
};

export default function InvestorBenchmarks() {
  // search
  const [investor, setInvestor] = useState("");
  const [stage, setStage] = useState("Pre-seed");
  const [ticket, setTicket] = useState("250000");
  const [matches, setMatches] = useState<Match[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [busySearch, setBusySearch] = useState(false);

  // chat
  const [q, setQ] = useState("");
  const [ans, setAns] = useState("");
  const [busyChat, setBusyChat] = useState(false);

  async function runSearch() {
    setBusySearch(true);
    setMatches([]);
    setTotal(null);
    try {
      const r = await fetch("/api/investors/benchmarks/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          investor,
          stage,
          ticket: Number(ticket) || 0,
        }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || "search_failed");
      setMatches(j.matches || []);
      setTotal(j.total ?? null);
    } catch (e: any) {
      setMatches([]);
      setTotal(null);
      alert(e?.message || "Search failed");
    } finally {
      setBusySearch(false);
    }
  }

  async function runChat() {
    setBusyChat(true);
    setAns("");
    try {
      const r = await fetch("/api/investors/benchmarks/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          investor,
          stage,
          ticket: Number(ticket) || 0,
        }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || "chat_failed");
      setAns(j.answer || "");
    } catch (e: any) {
      setAns(`Error: ${e.message}`);
    } finally {
      setBusyChat(false);
    }
  }

  return (
    <section className="rounded-2xl border bg-white shadow p-6 space-y-4">
      <h3 className="text-lg font-semibold">Comparable Deals (Benchmarks)</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          className="border rounded px-3 py-2"
          placeholder="Investor org (optional)"
          value={investor}
          onChange={(e) => setInvestor(e.target.value)}
        />
        <input
          className="border rounded px-3 py-2"
          placeholder="Stage (e.g., Pre-seed, Seed)"
          value={stage}
          onChange={(e) => setStage(e.target.value)}
        />
        <input
          className="border rounded px-3 py-2"
          placeholder="Ticket (USD, e.g., 250000)"
          value={ticket}
          onChange={(e) => setTicket(e.target.value)}
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={runSearch}
          disabled={busySearch}
          className="rounded bg-indigo-600 text-white px-4 py-2"
        >
          {busySearch ? "Searching…" : "Search Matches"}
        </button>

        <button
          onClick={runChat}
          disabled={busyChat}
          className="rounded bg-gray-900 text-white px-4 py-2"
        >
          {busyChat ? "Analyzing…" : "Benchmarks Chat"}
        </button>
      </div>

      {total !== null && (
        <p className="text-sm text-gray-600">
          Search space: {total} deals (external+db+local). Showing top matches below.
        </p>
      )}

      {matches.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border rounded">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left p-2 border-b">Investor</th>
                <th className="text-left p-2 border-b">Company</th>
                <th className="text-left p-2 border-b">Stage</th>
                <th className="text-left p-2 border-b">Ticket</th>
                <th className="text-left p-2 border-b">Equity</th>
                <th className="text-left p-2 border-b">Date</th>
                <th className="text-left p-2 border-b">Source</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((m, i) => (
                <tr key={i} className="border-b">
                  <td className="p-2">{m.investor || "—"}</td>
                  <td className="p-2">{m.company || "—"}</td>
                  <td className="p-2">{m.stage || "—"}</td>
                  <td className="p-2">
                    {typeof m.ticket === "number"
                      ? `$${Math.round(m.ticket).toLocaleString()}`
                      : "—"}
                  </td>
                  <td className="p-2">
                    {typeof m.equity === "number"
                      ? `${Math.round(Number(m.equity) * 100)}%`
                      : (m.equity || "—")}
                  </td>
                  <td className="p-2">{m.date || "—"}</td>
                  <td className="p-2">{m.source || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {ans && (
        <div className="text-sm whitespace-pre-wrap rounded bg-gray-50 p-3">
          {ans}
        </div>
      )}
    </section>
  );
}
