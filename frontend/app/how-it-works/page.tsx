export default function HowItWorks() {
  const steps = [
    { title: "1) Identity & KYC", desc: "Verify business identity and stakeholders with document checks and (future) API verifications. Establish trust anchors for trade parties." },
    { title: "2) Order & Contract", desc: "Create digital POs, invoices, and trade contracts with auditable versions. Map roles and obligations clearly to unlock finance and logistics." },
    { title: "3) Payments & Escrow", desc: "Secure funds flow with milestone-based releases (escrow or LC-style constructs). Reduce counterparty risk and shorten payment cycles." },
    { title: "4) Trade Finance", desc: "Allow financiers to underwrite working capital on real data and events (POs, GRNs, shipment milestones). Improve access and pricing." },
    { title: "5) Logistics & Visibility", desc: "Book and track consignments with unified status. Surface exceptions early (delays, shortages) and keep all parties aligned." },
    { title: "6) Compliance & Docs OS", desc: "Auto-generate, validate, and store documents (GST/e-way, export docs, BoL). Keep a single source of truth for audits and settlements." }
  ];

  return (
    <main className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-semibold tracking-tight">How GSOS works</h1>
      <p className="mt-3 text-gray-600 max-w-3xl">
        GSOS is a neutral operating layer that connects identity, finance, logistics, and compliance so SMEs can trade
        like enterprises. Here’s the end-to-end lifecycle we support:
      </p>
      <ol className="mt-10 grid gap-6 sm:grid-cols-2">
        {steps.map((s) => (
          <li key={s.title} className="border rounded-2xl p-5 hover:shadow-sm transition">
            <h3 className="text-lg font-semibold">{s.title}</h3>
            <p className="mt-2 text-gray-700">{s.desc}</p>
          </li>
        ))}
      </ol>
      <section className="mt-12 border rounded-2xl p-6 bg-gray-50">
        <h2 className="text-2xl font-semibold">Why this matters</h2>
        <ul className="mt-3 list-disc pl-6 text-gray-700 space-y-1">
          <li>Reduce stockouts and working-capital blockage with better data and milestone finance.</li>
          <li>Cut compliance friction—documents become predictable, reusable, and auditable.</li>
          <li>Build trust between buyers, sellers, financiers, and logistics through shared, verifiable events.</li>
        </ul>
        <div className="mt-6">
          <a className="inline-block bg-indigo-600 text-white px-4 py-2 rounded" href="/survey">Take the Readiness Survey</a>
        </div>
      </section>
    </main>
  );
}
