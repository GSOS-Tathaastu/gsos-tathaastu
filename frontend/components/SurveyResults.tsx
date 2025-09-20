"use client";

import React from "react";

type Simulation = {
  savingsEstimate: { shortTermPct?: number; midTermPct?: number; longTermPct?: number };
  goals?: { short?: string[]; mid?: string[]; long?: string[] };
  gsosValue?: string[];
  onboardingWillingnessQuestion?: boolean;
  plans?: {
    freemium?: string[];
    subscription?: { tier: string; price: string; features: string[] }[];
  };
};

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl bg-indigo-700 text-white p-4 w-full">
      <div className="text-2xl font-extrabold">{value}</div>
      <div className="text-xs opacity-90">{label}</div>
    </div>
  );
}

function Card({ title, children, tone="slate" }:{
  title: string; children: React.ReactNode; tone?: "slate"|"stone"|"zinc";
}) {
  const toneClass = {
    slate: "bg-slate-900",
    stone: "bg-stone-900",
    zinc:  "bg-zinc-900"
  }[tone];

  return (
    <div className={`rounded-2xl p-5 text-slate-100 shadow ${toneClass}`}>
      <h4 className="font-semibold mb-3">{title}</h4>
      {children}
    </div>
  );
}

export default function SurveyResults({ simulation }: { simulation: Simulation }) {
  const s = simulation?.savingsEstimate || {};
  const pct = (n?: number) => (typeof n === "number" ? `${n}%` : "—");

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h2 className="text-3xl font-extrabold mb-4 flex items-center gap-3">
        <span className="inline-block w-2 h-6 bg-indigo-600 rounded-full" />
        Your GSOS Simulation
      </h2>

      {/* Savings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
        <Pill label="Short-term" value={pct(s.shortTermPct)} />
        <Pill label="Mid-term"   value={pct(s.midTermPct)}   />
        <Pill label="Long-term"  value={pct(s.longTermPct)}  />
      </div>

      {/* Goals & Value */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <Card title="Short-term Goals">
          <ul className="list-disc ml-5 space-y-1 text-sm">
            {(simulation.goals?.short ?? []).map((g, i) => <li key={i}>{g}</li>)}
          </ul>
        </Card>
        <Card title="Mid-term Goals" tone="stone">
          <ul className="list-disc ml-5 space-y-1 text-sm">
            {(simulation.goals?.mid ?? []).map((g, i) => <li key={i}>{g}</li>)}
          </ul>
        </Card>
        <Card title="Long-term Goals" tone="zinc">
          <ul className="list-disc ml-5 space-y-1 text-sm">
            {(simulation.goals?.long ?? []).map((g, i) => <li key={i}>{g}</li>)}
          </ul>
        </Card>
      </div>

      <Card title="How GSOS Helps" tone="slate">
        <ul className="list-disc ml-5 space-y-1 text-sm">
          {(simulation.gsosValue ?? []).map((x, i) => <li key={i}>{x}</li>)}
        </ul>
      </Card>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-8">
        <div className="rounded-2xl p-6 bg-emerald-900 text-emerald-50 shadow">
          <h4 className="font-semibold mb-2">Freemium Plan</h4>
          <ul className="list-disc ml-5 space-y-1 text-sm">
            {(simulation.plans?.freemium ?? []).map((f, i) => <li key={i}>{f}</li>)}
          </ul>
        </div>
        <div className="rounded-2xl p-6 bg-amber-900 text-amber-50 shadow">
          <h4 className="font-semibold mb-2">Subscription Plans</h4>
          <div className="space-y-3">
            {(simulation.plans?.subscription ?? []).map((t, i) => (
              <div key={i} className="rounded-xl bg-amber-800/60 p-3">
                <div className="font-semibold">
                  {t.tier} — <span className="opacity-90">{t.price}</span>
                </div>
                <ul className="list-disc ml-5 text-sm">
                  {t.features.map((f, j) => <li key={j}>{f}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      {simulation.onboardingWillingnessQuestion && (
        <div className="mt-8 flex flex-wrap gap-3">
          <button className="rounded-xl bg-indigo-600 text-white px-5 py-3 font-semibold">
            I’m ready to onboard
          </button>
          <button className="rounded-xl border px-5 py-3">
            Book a walkthrough
          </button>
        </div>
      )}
    </div>
  );
}
