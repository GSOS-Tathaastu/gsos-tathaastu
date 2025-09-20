"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type StepKey = "ingest" | "analyze" | "act" | "scale";

const STEP_CONTENT: Record<
  StepKey,
  { title: string; icon: string; desc: string; details: string[] }
> = {
  ingest: {
    title: "Ingest",
    icon: "📥",
    desc: "GSOS connects your ERP, invoices, shipment docs, banking and marketplace feeds — automatically.",
    details: [
      "One-click connectors for Tally/Zoho/QuickBooks, Shopify/Woo, and S3/Drive.",
      "Auto OCR + doc normalization for invoices, POs, e-way bills, BOL, AWB.",
      "Webhook-based deltas so you’re always up-to-date (no manual syncs).",
    ],
  },
  analyze: {
    title: "Analyze",
    icon: "📊",
    desc: "AI benchmarks your bottlenecks against real trade patterns and internal baselines.",
    details: [
      "Pattern mining across stockouts, overstock, turns, OTD & lead-time variance.",
      "RAG over your docs for explainable decisions (citations by paragraph).",
      "Risk scoring for SKUs/suppliers/channels with seasonality awareness.",
    ],
  },
  act: {
    title: "Act",
    icon: "⚡",
    desc: "Surface replenishment, finance routes, and compliance workflows in one place.",
    details: [
      "Smart replenishment (ABC/XYZ, MOQ/MOQ), purchase triggers, and allocation.",
      "Finance routing: map invoices to credit lines or discounting partners.",
      "Compliance flows: auto-check HS codes, valuation flags, and doc gaps.",
    ],
  },
  scale: {
    title: "Scale",
    icon: "🚀",
    desc: "Unlock faster payments, better margins, and cross-border readiness with confidence.",
    details: [
      "Faster working capital cycles via structured, trusted data.",
      "Channel expansion playbooks: what to launch, where, and when.",
      "Executive scorecards & alerts — make decisions in hours, not weeks.",
    ],
  },
};

type WBCard = {
  label: string;
  value: string;
  sub?: string;
};

function fmtMoney(n: number | null) {
  if (n == null) return "—";
  const abs = Math.abs(n);
  if (abs >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${Math.round(n).toLocaleString()}`;
}

export default function HomeLandingClient() {
  const [openStep, setOpenStep] = useState<StepKey | null>(null);

  const stats = useMemo(
    () => [
      { label: "Global Trade", value: "$32T", sub: "Total goods & services" },
      { label: "Financing Gap", value: "$2.5T", sub: "For legitimate exporters" },
      { label: "Fraud / yr", value: "$50B+", sub: "Trade finance fraud" },
      { label: "Customs Leakage", value: "10–15%", sub: "Under-invoicing losses" },
    ],
    []
  );

  const [wbCards, setWbCards] = useState<WBCard[] | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/worldbank?country=IND")
      .then((r) => r.json())
      .then((j) => {
        if (!alive || !j?.ok) return;
        const { stats } = j;
        const cards: WBCard[] = [
          {
            label: "Exports (% GDP)",
            value:
              stats?.expPct?.value != null
                ? `${(+stats.expPct.value).toFixed(1)}%`
                : "—",
            sub: stats?.expPct?.date,
          },
          {
            label: "Imports (% GDP)",
            value:
              stats?.impPct?.value != null
                ? `${(+stats.impPct.value).toFixed(1)}%`
                : "—",
            sub: stats?.impPct?.date,
          },
          {
            label: "Exports (US$)",
            value: fmtMoney(stats?.expUsd?.value ?? null),
            sub: stats?.expUsd?.date,
          },
          {
            label: "Imports (US$)",
            value: fmtMoney(stats?.impUsd?.value ?? null),
            sub: stats?.impUsd?.date,
          },
        ];
        setWbCards(cards);
      })
      .catch(() => {
        // swallow errors silently
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <main className="min-h-screen">
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50 to-white">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                GSOS – Global Supply Operating System
              </h1>
              <p className="text-gray-700 mt-5 text-lg">
                Turn fragmented trade data into decisions. Ingest your docs, analyze bottlenecks with AI, act on replenishment & finance recommendations, and scale cross-border — with confidence and proof.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/survey"
                  className="inline-flex items-center px-5 py-3 rounded-xl bg-black text-white hover:bg-gray-900"
                >
                  Take the Readiness Survey
                </Link>
                <a
                  href="#crisis"
                  className="inline-flex items-center px-5 py-3 rounded-xl border hover:bg-gray-50"
                >
                  Why GSOS now?
                </a>
              </div>
            </div>

            <div className="relative">
              <Image
                src="/hero-pipeline.png"
                alt="GSOS pipeline"
                width={900}
                height={650}
                className="rounded-2xl shadow-lg w-full h-auto"
                priority
              />
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid md:grid-cols-4 gap-6 mt-14">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border p-5 bg-white shadow-sm hover:shadow transition"
              >
                <div className="text-3xl font-extrabold">{s.value}</div>
                <div className="text-gray-700 font-medium mt-1">{s.label}</div>
                <div className="text-gray-500 text-sm mt-1">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CRISIS */}
      <section id="crisis" className="py-16 px-6 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold mb-6">
          The Global Trade Crisis: A $32 Trillion Opportunity
        </h2>
        <div className="prose max-w-none prose-indigo">
          <p>
            Global trade has shaped civilizations for millennia—from Silk Road caravans to Dutch East India Companies. Yet despite breathtaking technological advances, today&apos;s <strong>$32 trillion</strong> trade ecosystem remains astonishingly fragmented, paper-heavy, and fraud-prone.
          </p>
          <p>
            The costs are staggering: over <strong>$50 billion</strong> in annual trade finance fraud, a <strong>$2.5 trillion</strong> financing gap for legitimate exporters, and <strong>10–15%</strong> of customs revenue lost to under-invoicing. These aren&apos;t marginal issues—they&apos;re systemic weaknesses that erode global GDP and disproportionately hurt developing economies.
          </p>
          <p>
            <strong>India</strong> exemplifies this paradox. While leading in digital infrastructure with Aadhaar and UPI, its trade ecosystem still sees exporters waiting 30–90 days for payments and SMEs—contributing 45% of exports—excluded from affordable trade finance due to documentation mistrust.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-10">
          {["/poster1.png", "/poster2.png", "/poster3.png"].map((p) => (
            <div key={p} className="rounded-xl border overflow-hidden bg-white">
              <Image src={p} alt="GSOS poster" width={800} height={600} className="w-full h-auto" />
            </div>
          ))}
        </div>
      </section>

      {/* World Bank Snapshot */}
      {wbCards && (
        <section className="py-10 px-6 max-w-5xl mx-auto">
          <h3 className="text-2xl font-semibold mb-4">World Bank Snapshot — India</h3>
          <div className="grid md:grid-cols-4 gap-6">
            {wbCards.map((c) => (
              <div
                key={c.label}
                className="rounded-xl border p-5 bg-white shadow-sm hover:shadow transition"
              >
                <div className="text-xl font-bold">{c.value}</div>
                <div className="text-gray-700 mt-1">{c.label}</div>
                {c.sub && <div className="text-gray-500 text-sm mt-1">{c.sub}</div>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* How GSOS Works */}
      <section className="bg-indigo-50 py-20 px-6">
        <h2 className="text-3xl font-bold text-center mb-12">How GSOS Works</h2>
        <div className="relative max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-6">
            {(Object.keys(STEP_CONTENT) as StepKey[]).map((key, i) => {
              const step = STEP_CONTENT[key];
              const isOpen = openStep === key;
              return (
                <button
                  key={key}
                  onClick={() => setOpenStep(isOpen ? null : key)}
                  className={`relative text-left bg-white rounded-2xl p-6 shadow-md transition hover:shadow-xl border ${
                    isOpen ? "ring-2 ring-indigo-400" : ""
                  }`}
                >
                  <div className="text-4xl mb-4 animate-bounce-slow">{step.icon}</div>
                  <h3 className="font-semibold text-lg mb-1">
                    {i + 1}. {step.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{step.desc}</p>
                  {i < 3 && (
                    <div className="hidden md:block absolute top-1/2 right-[-1.25rem] w-5 h-[2px] bg-indigo-400" />
                  )}
                </button>
              );
            })}
          </div>

          {openStep && (
            <div className="mt-8 bg-white rounded-2xl border shadow-md p-6 md:p-8 transition">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{STEP_CONTENT[openStep].icon}</span>
                <h3 className="text-xl font-semibold">{STEP_CONTENT[openStep].title}</h3>
              </div>
              <p className="text-gray-700 mb-4">{STEP_CONTENT[openStep].desc}</p>
              <ul className="list-disc ml-6 space-y-2 text-gray-700">
                {STEP_CONTENT[openStep].details.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <style jsx>{`
          .animate-bounce-slow {
            animation: bounce 3s infinite;
          }
          @keyframes bounce {
            0%,
            100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-4px);
            }
          }
        `}</style>
      </section>

      {/* CTA */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl text-white p-8 md:p-12 shadow-lg">
          <h3 className="text-2xl md:text-3xl font-bold">Ready to see your savings & scale map?</h3>
          <p className="mt-2 text-indigo-100">
            Take the readiness survey — get grounded insights, simulated savings, and a near-term GSOS plan with citations.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/survey"
              className="inline-flex items-center px-5 py-3 rounded-xl bg-white text-indigo-700 font-medium hover:bg-indigo-50"
            >
              Start the Survey
            </Link>
            <a
              href="#crisis"
              className="inline-flex items-center px-5 py-3 rounded-xl border border-white/40 hover:bg-white/10"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Video */}
      <section className="py-8 px-6 max-w-5xl mx-auto">
        <h3 className="text-xl font-semibold mb-4">Inside GSOS (Product Walkthrough)</h3>
        <div className="aspect-video rounded-xl overflow-hidden border bg-black">
          <video
            className="w-full h-full"
            controls
            poster="/video-poster.png"
            src="/videos/gsos-overview.mp4"
          />
        </div>
      </section>
    </main>
  );
}
