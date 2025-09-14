"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// Example: fetch problems from API (mock for now)
async function fetchTradeProblems() {
  try {
    const res = await fetch("https://api.publicapis.org/entries"); // placeholder
    if (!res.ok) return [];
    const data = await res.json();
    // In reality, map to real trade issues
    return data.entries.slice(0, 5).map((e: any) => e.Description);
  } catch {
    return ["Global container shortages", "Tariff disputes", "Currency volatility"];
  }
}

export default function LandingPage() {
  const [problems, setProblems] = useState<string[]>([]);

  useEffect(() => {
    fetchTradeProblems().then(setProblems);
  }, []);

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative bg-gradient-to-r from-indigo-600 to-purple-700 text-white py-20 px-6 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-4 animate-pulse">
          Global Supply Operating System (GSOS)
        </h1>
        <p className="text-lg md:text-2xl mb-6 max-w-3xl mx-auto">
          Fix inefficiencies, break silos, and scale your global trade with AI-driven intelligence.
        </p>
        <Link
          href="/survey"
          className="bg-white text-indigo-700 font-semibold px-6 py-3 rounded-lg shadow-lg hover:bg-gray-200 transition"
        >
          Take the Readiness Survey
        </Link>
        {/* Flashfile effect */}
        <div className="absolute inset-0 bg-[url('/hero-flash.gif')] opacity-10 bg-cover bg-center pointer-events-none" />
      </section>

      {/* Problems ticker */}
      <section className="py-12 bg-gray-50">
        <h2 className="text-2xl font-semibold text-center mb-6">Trade Challenges Today</h2>
        <div className="overflow-hidden h-12 relative">
          <div className="animate-marquee whitespace-nowrap">
            {problems.map((p, i) => (
              <span key={i} className="mx-8 text-lg font-medium text-gray-700">
                🚩 {p}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Posters / visuals */}
      <section className="py-16 px-6 grid md:grid-cols-3 gap-6">
        <div className="bg-white shadow rounded-xl p-6 text-center">
          <img src="/poster1.png" alt="Trade poster" className="mx-auto h-32 mb-4" />
          <p className="text-gray-600">Delayed shipments affect 40% of retailers monthly.</p>
        </div>
        <div className="bg-white shadow rounded-xl p-6 text-center">
          <img src="/poster2.png" alt="Poster" className="mx-auto h-32 mb-4" />
          <p className="text-gray-600">SMEs lose billions due to poor demand forecasting.</p>
        </div>
        <div className="bg-white shadow rounded-xl p-6 text-center">
          <img src="/poster3.png" alt="Poster" className="mx-auto h-32 mb-4" />
          <p className="text-gray-600">Cross-border paperwork slows growth by 20%.</p>
        </div>
      </section>

      {/* How GSOS helps */}
      <section className="bg-indigo-50 py-16 px-6">
        <h2 className="text-2xl font-semibold text-center mb-8">How GSOS Helps</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            ["Inventory Optimization", "Reduce stockouts & overstock"],
            ["Smart Integrations", "Connect ERP, e-comm, finance seamlessly"],
            ["AI Insights", "Forecast demand and simulate savings"],
          ].map(([title, desc]) => (
            <div key={title} className="bg-white p-6 shadow rounded-lg text-center">
              <h3 className="font-semibold text-lg mb-2">{title}</h3>
              <p className="text-gray-600">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
