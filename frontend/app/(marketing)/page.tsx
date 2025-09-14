"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * Disable prerender/SSG for this page to avoid the "clientModules" error.
 * Keeps everything purely client-side.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Simple poster with graceful fallback if the asset is missing */
function Poster({ src, alt }: { src: string; alt: string }) {
  const [ok, setOk] = useState(true);
  if (!ok) {
    return (
      <div className="h-40 md:h-52 w-full rounded-xl bg-gradient-to-br from-zinc-100 to-zinc-300 dark:from-zinc-800 dark:to-zinc-700 flex items-center justify-center text-sm text-zinc-600 dark:text-zinc-300">
        {alt}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className="h-40 md:h-52 w-full object-cover rounded-xl border border-zinc-200 dark:border-zinc-800"
      onError={() => setOk(false)}
      loading="lazy"
    />
  );
}

type Step = {
  key: string;
  title: string;
  brief: string;
  details: string;
};

const STEPS: Step[] = [
  {
    key: "ingest",
    title: "Ingest",
    brief: "Securely ingest docs, ledgers, shipments & messages.",
    details:
      "GSOS normalizes .docx, .pdf, CSVs and integration feeds (Shopify, Tally/Zoho, ERPs). Content is chunked and embedded (OpenAI or local), enabling precise retrieval without exposing raw data.",
  },
  {
    key: "understand",
    title: "Understand",
    brief: "Contextual RAG + rules to detect risks & opportunities.",
    details:
      "We link contracts to shipments, reconcile invoices to POs, and score suppliers/carriers. Domain rules spotlight under/over-invoicing, aging receivables, demand anomalies, and customs risk patterns.",
  },
  {
    key: "simulate",
    title: "Simulate",
    brief: "What-if simulations for cost, service level & cash.",
    details:
      "Quickly test replenishment, lead-time shifts, MOQ changes, or finance options. Estimate inventory, stockouts, OTD and working-capital impact—then pick the plan that meets KPIs.",
  },
  {
    key: "automate",
    title: "Automate",
    brief: "Close the loop across your stack.",
    details:
      "Push replenishment suggestions, auto-create ASN/Docs packs, trigger financing, notify stakeholders. APIs & webhooks wire GSOS into ERPs, WMS, marketplace ops, and bank/fintech rails.",
  },
];

export default function MarketingHome() {
  const [open, setOpen] = useState<string | null>("ingest");

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h1 className="text-3xl md:text-5xl font-bold leading-tight">
                GSOS TATHAASTU
              </h1>
              <p className="mt-4 text-lg md:text-xl text-zinc-600 dark:text-zinc-300">
                The modern operating system for global trade & supply operations:
                ingest → understand → simulate → automate.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/survey"
                  className="px-5 py-2.5 rounded-lg bg-black text-white hover:opacity-90"
                >
                  Take the Readiness Survey
                </Link>
                <a
                  href="#how"
                  className="px-5 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                >
                  How GSOS Works
                </a>
              </div>
            </div>

            {/* Media: poster or gradient fallback (works if no image/video present) */}
            <div className="relative">
              <Poster src="/poster1.png" alt="GSOS Overview" />
              <div className="absolute -z-10 inset-0 blur-3xl bg-gradient-to-tr from-teal-200/40 to-indigo-200/40 dark:from-teal-900/30 dark:to-indigo-900/30" />
            </div>
          </div>
        </div>
      </section>

      {/* THE GLOBAL TRADE CRISIS */}
      <section className="border-t border-zinc-100 dark:border-zinc-900">
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-16">
          <h2 className="text-2xl md:text-3xl font-semibold">
            The Global Trade Crisis: A $32 Trillion Opportunity
          </h2>
          <div className="mt-4 text-zinc-700 dark:text-zinc-300 space-y-4">
            <p>
              Global trade has shaped civilizations for millennia—from Silk Road
              caravans to Dutch East India Companies. Yet despite breathtaking
              technological advances, today&apos;s <strong>$32T</strong> trade
              ecosystem remains fragmented, paper-heavy, and fraud-prone.
            </p>
            <p>
              The costs are staggering: <strong>$50B+</strong> annual trade
              finance fraud, a <strong>$2.5T</strong> financing gap for legitimate
              exporters, and <strong>10–15%</strong> of customs revenue lost to
              under-invoicing. These are systemic weaknesses that erode global GDP
              and disproportionately hurt developing economies.
            </p>
            <p>
              India exemplifies this paradox. While leading in digital
              infrastructure with Aadhaar and UPI, exporters still wait
              <strong> 30–90 days</strong> for payments; SMEs—contributing{" "}
              <strong>45%</strong> of exports—are excluded from affordable trade
              finance due to documentation mistrust.
            </p>
          </div>

          {/* Problem Posters (fallback if missing) */}
          <div className="mt-8 grid sm:grid-cols-3 gap-4">
            <Poster src="/poster2.png" alt="Fragmented paperwork & fraud" />
            <Poster src="/poster3.png" alt="Financing gap & delays" />
            <Poster src="/poster1.png" alt="Operational blind spots" />
          </div>
        </div>
      </section>

      {/* HOW GSOS WORKS */}
      <section id="how" className="border-t border-zinc-100 dark:border-zinc-900">
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-16">
          <h2 className="text-2xl md:text-3xl font-semibold">How GSOS Works</h2>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Four steps, wired into your current tools. Click a step to expand.
          </p>

          <div className="mt-6 grid md:grid-cols-2 gap-5">
            {STEPS.map((s, idx) => {
              const active = open === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => setOpen((prev) => (prev === s.key ? null : s.key))}
                  className={`text-left p-5 rounded-2xl border ${
                    active
                      ? "bg-zinc-50 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700"
                      : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50/60 dark:hover:bg-zinc-900/60"
                  } transition`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-6 w-6 rounded-full bg-black text-white flex items-center justify-center text-xs">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="font-medium">{s.title}</div>
                      <div className="text-sm text-zinc-600 dark:text-zinc-400">
                        {s.brief}
                      </div>
                      {active && (
                        <div className="mt-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                          {s.details}
                          {/* “Animation” shim: subtle progress bar grows when expanded */}
                          <div className="mt-3 h-1.5 rounded bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                            <div className="h-full w-full origin-left scale-x-0 animate-[grow_900ms_ease-out_forwards] bg-black/80 dark:bg-white/80" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <style jsx global>{`
            @keyframes grow {
              to {
                transform: scaleX(1);
              }
            }
          `}</style>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/survey"
              className="px-5 py-2.5 rounded-lg bg-black text-white hover:opacity-90"
            >
              Start Readiness Survey
            </Link>
            <a
              href="#plans"
              className="px-5 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900"
            >
              Explore Plans
            </a>
          </div>
        </div>
      </section>

      {/* PLANS PREVIEW (non-duplicative brief) */}
      <section
        id="plans"
        className="border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/30"
      >
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-16">
          <h2 className="text-2xl md:text-3xl font-semibold">Plans (Preview)</h2>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            From discovery to scale—fit your stage and systems. Full details after the survey.
          </p>
          <div className="mt-6 grid md:grid-cols-3 gap-5">
            {[
              {
                name: "Starter",
                price: "$199–$399/mo",
                pts: ["Survey & insights", "Basic dashboards", "Email support", "Up to 3 integrations"],
              },
              {
                name: "Growth",
                price: "$499–$999/mo",
                pts: ["RAG insights", "Replenishment helper", "Priority support", "Up to 6 integrations"],
              },
              {
                name: "Scale",
                price: "$1500–$3000/mo",
                pts: ["Full suite", "Custom connectors", "SLA support", "Unlimited integrations"],
              },
            ].map((p) => (
              <div
                key={p.name}
                className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 bg-white/70 dark:bg-zinc-950/70"
              >
                <div className="flex items-baseline justify-between">
                  <div className="text-lg font-semibold">{p.name}</div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">{p.price}</div>
                </div>
                <ul className="mt-3 text-sm list-disc ml-5 space-y-1">
                  {p.pts.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <Link
              href="/survey"
              className="px-5 py-2.5 rounded-lg bg-black text-white hover:opacity-90"
            >
              Continue to Survey
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-zinc-100 dark:border-zinc-900">
        <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-zinc-600 dark:text-zinc-400">
          © {new Date().getFullYear()} GSOS TATHAASTU. All rights reserved.
        </div>
      </footer>
    </main>
  );
}
