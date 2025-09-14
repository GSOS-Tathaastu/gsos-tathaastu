"use client";
import { useState } from "react";

type Step = { key: string; title: string; blurb: string; details: string };

const STEPS: Step[] = [
  { key: "ingest", title: "Ingest", blurb: "One-click connectors for ERP, invoices, shipments, docs.", details: "Upload/connect systems. GSOS normalizes formats and extracts entities—SKUs, lots, suppliers, terms." },
  { key: "analyze", title: "Analyze", blurb: "Benchmarks risks—stockouts, overstock, supplier reliability.", details: "Context-grounded AI ranks bottlenecks using your data with explainable scores and citations." },
  { key: "act", title: "Act", blurb: "Trigger replenishment, unlock finance, auto-check compliance.", details: "Approve replenishment, route to finance, and run compliance checks automatically. Fully auditable." },
  { key: "scale", title: "Scale", blurb: "Expand markets with faster capital cycles & exec scorecards.", details: "Playbooks, quarterly benchmarks, and partner integrations accelerate exports and reduce WC cycles." },
];

export default function Stepper() {
  const [open, setOpen] = useState<string | null>("ingest");
  return (
    <div className="space-y-3">
      {STEPS.map((s, i) => {
        const isOpen = open === s.key;
        return (
          <div key={s.key} className="rounded-2xl border">
            <button className="w-full flex items-center justify-between px-5 py-4" onClick={() => setOpen(isOpen ? null : s.key)} aria-expanded={isOpen}>
              <div className="text-left">
                <div className="text-sm text-zinc-500">Step {i + 1}</div>
                <div className="text-lg font-medium">{s.title}</div>
                <div className="text-zinc-600">{s.blurb}</div>
              </div>
              <div className="ml-4 text-2xl">{isOpen ? "–" : "+"}</div>
            </button>
            <div className={`grid transition-all duration-300 ease-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
              <div className="overflow-hidden">
                <div className="px-5 pb-5 text-zinc-700">{s.details}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
