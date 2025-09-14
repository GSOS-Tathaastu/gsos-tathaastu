// frontend/components/Stepper.tsx
"use client";
import { useState } from "react";

type Step = {
  key: string;
  title: string;
  blurb: string;
  details: string;
};

const STEPS: Step[] = [
  {
    key: "ingest",
    title: "Ingest",
    blurb: "One-click connectors for ERP, invoices, shipments, docs.",
    details:
      "Upload or connect systems (Tally/Zoho/Shopify/Custom DB). GSOS normalizes formats and extracts entities—SKUs, lots, suppliers, terms—without changing your current stack.",
  },
  {
    key: "analyze",
    title: "Analyze",
    blurb: "Benchmarks risks—stockouts, overstock, supplier reliability.",
    details:
      "Context-grounded AI ranks bottlenecks using your real data. Explainable scores show why issues occur, with citations to uploaded documents for trust.",
  },
  {
    key: "act",
    title: "Act",
    blurb: "Trigger replenishment, unlock finance, auto-check compliance.",
    details:
      "Approve replenishment for top SKUs, route to trade finance, and run compliance checks automatically. Actions are logged and auditable.",
  },
  {
    key: "scale",
    title: "Scale",
    blurb: "Expand markets with faster capital cycles & exec scorecards.",
    details:
      "Standardized playbooks, quarterly benchmarks, and partner integrations accelerate exports and reduce working capital cycles.",
  },
];

export default function Stepper() {
  const [open, setOpen] = useState<string | null>("ingest");

  return (
    <div className="space-y-3">
      {STEPS.map((s, i) => {
        const isOpen = open === s.key;
        return (
          <div key={s.key} className="rounded-2xl border">
            <button
              className="w-full flex items-center justify-between px-5 py-4"
              onClick={() => setOpen(isOpen ? null : s.key)}
              aria-expanded={isOpen}
            >
              <div className="text-left">
                <div className="text-sm text-zinc-500">Step {i + 1}</div>
                <div className="text-lg font-medium">{s.title}</div>
                <div className="text-zinc-600">{s.blurb}</div>
              </div>
              <div className="ml-4 text-2xl">{isOpen ? "–" : "+"}</div>
            </button>

            <div
              className={`grid transition-all duration-300 ease-out ${
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <div className="px-5 pb-5 text-zinc-700">{s.details}</div>
                {/* Placeholder for an inline animation/GIF if you add later */}
                {/* <div className="px-5 pb-5">
                  <video src="/videos/how-it-works.mp4" className="w-full rounded-xl" muted autoPlay loop />
                </div> */}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
