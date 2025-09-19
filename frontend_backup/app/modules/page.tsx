type Module = {
  name: string;
  summary: string;
  bullets: string[];
};

const modules: Module[] = [
  {
    name: "Identity & KYC",
    summary: "Verified business profiles and stakeholder checks that anchor trust. Supports document uploads now; API-based verification on roadmap.",
    bullets: [
      "Business identity profiles; document vault",
      "Configurable verification checklist",
      "Roadmap: Aadhaar eKYC, PAN/GST API checks"
    ]
  },
  {
    name: "Order & Invoicing",
    summary: "Digital POs, invoices, and contracts with version history. Reduce disputes by aligning data early.",
    bullets: [
      "PO/Invoice templates, status tracking",
      "Line-item reconciliation hints",
      "Export-friendly formats"
    ]
  },
  {
    name: "Payments & Escrow",
    summary: "Milestone-based releases mimic LC-like security without heavy paperwork. Aligns cash with delivery.",
    bullets: [
      "Hold funds until events (dispatch, delivery, QC) occur",
      "Partial releases; exception workflows",
      "Ledger for auditability"
    ]
  },
  {
    name: "Trade Finance",
    summary: "Working capital for SMEs underwritten on real trade events. Financiers get visibility and risk controls.",
    bullets: [
      "Eligibility scoring from PO → GRN → invoice",
      "Plug-and-play with multiple financiers",
      "Transparent events for risk teams"
    ]
  },
  {
    name: "Logistics & Visibility",
    summary: "Book, track, and manage exceptions across carriers. Turn opaque shipments into reliable data.",
    bullets: [
      "Unified milestones (pickup, in-transit, delivered)",
      "Exception alerts and ETA updates",
      "Basic documents: e-way bill / BoL references"
    ]
  },
  {
    name: "Compliance & Docs OS",
    summary: "Generate, validate, and store statutory documents. A single source of truth for audits and settlements.",
    bullets: [
      "Templates for GST/e-way and export packs",
      "Validation checks before submission",
      "Immutable history of changes"
    ]
  }
];

export default function ModulesPage() {
  return (
    <main className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-semibold tracking-tight">Modules</h1>
      <p className="mt-3 text-gray-600 max-w-3xl">
        Mix and match GSOS modules to fit your trade flow. Start with the basics and add capabilities as you scale.
      </p>
      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {modules.map((m) => (
          <div key={m.name} className="border rounded-2xl p-6 hover:shadow-sm transition bg-white">
            <h3 className="text-xl font-semibold">{m.name}</h3>
            <p className="mt-2 text-gray-700">{m.summary}</p>
            <ul className="mt-3 list-disc pl-6 text-gray-700 space-y-1">
              {m.bullets.map((b, i) => <li key={i}>{b}</li>)}
            </ul>
          </div>
        ))}
      </div>
      <section className="mt-12 border rounded-2xl p-6 bg-gray-50">
        <h2 className="text-2xl font-semibold">What’s next</h2>
        <p className="mt-2 text-gray-700">
          We’re expanding India integrations (GSTN, Aadhaar, NHAI, DGFT/ICEGATE) and adding partner portals for financiers
          and logistics providers.
        </p>
        <div className="mt-6 flex gap-3">
          <a className="bg-indigo-600 text-white px-4 py-2 rounded" href="/survey">Check readiness</a>
          <a className="border px-4 py-2 rounded" href="/contact">Talk to us</a>
        </div>
      </section>
    </main>
  );
}
