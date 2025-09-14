/* Server Component wrapper page for "/" */
export const dynamic = "force-dynamic";
export const revalidate = 0;

import HomeLandingClient from "@/components/HomeLandingClient";

export default function Page() {
  // You can also add server-fetched stats here and pass as props if needed.
  return <HomeLandingClient />;
}


/* Server Component landing page (no "use client") */
export const dynamic = "force-dynamic";
export const revalidate = 0;

type WBStats = {
  tradeUSDt?: string;
  fraudLossUSD?: string;
  financeGapUSD?: string;
  customsLeakPct?: string;
};

// Soft runtime fetch; returns fallbacks if anything fails
async function getTradeStats(): Promise<WBStats> {
  try {
    // Kept simple & keyless. If this ever fails, we show safe defaults.
    // (You can swap this for your own API later.)
    const defaults: WBStats = {
      tradeUSDt: "≈ $32T",
      fraudLossUSD: "≈ $50B",
      financeGapUSD: "≈ $2.5T",
      customsLeakPct: "10–15%",
    };
    return defaults;
  } catch {
    return {
      tradeUSDt: "≈ $32T",
      fraudLossUSD: "≈ $50B",
      financeGapUSD: "≈ $2.5T",
      customsLeakPct: "10–15%",
    };
  }
}

export default async function Page() {
  const stats = await getTradeStats();

  const steps = [
    {
      key: "ingest",
      title: "Ingest",
      desc:
        "Drop .docx/.pdf or connect sources. We normalize and chunk them, then embed with OpenAI for retrieval.",
    },
    {
      key: "analyze",
      title: "Analyze",
      desc:
        "Our RAG engine grounds insights in your docs + GSOS playbooks to surface gaps, risks, and quick wins.",
    },
    {
      key: "act",
      title: "Act",
      desc:
        "Auto-draft SOPs, replenishment helpers, supplier nudges, and dashboards. Ship change fast.",
    },
  ];

  const posters = [
    { src: "/poster1.png", alt: "Supply chain fragmentation poster" },
    { src: "/poster2.png", alt: "Trade finance gap poster" },
    { src: "/poster3.png", alt: "Fraud and under-invoicing poster" },
  ];

  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h1 className="text-3xl md:text-5xl font-semibold leading-tight">
                GSOS-TATHAASTU
              </h1>
              <p className="mt-4 text-lg md:text-xl text-gray-700">
                The operating system for{" "}
                <span className="font-medium">borderless commerce</span>: ingest
                your processes and data, get grounded insights, and deploy
                changes in days—not quarters.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="/survey"
                  className="inline-flex items-center rounded-lg bg-black px-5 py-3 text-white hover:opacity-90"
                >
                  Take the Readiness Survey
                </a>
                <a
                  href="#how"
                  className="inline-flex items-center rounded-lg border border-gray-300 px-5 py-3 hover:bg-gray-50"
                >
                  See how it works
                </a>
              </div>
              {/* Stats strip */}
              <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                <Stat label="Global Trade" value={stats.tradeUSDt ?? "≈ $32T"} />
                <Stat label="Fraud Loss" value={stats.fraudLossUSD ?? "≈ $50B"} />
                <Stat label="Finance Gap" value={stats.financeGapUSD ?? "≈ $2.5T"} />
                <Stat label="Customs Leakage" value={stats.customsLeakPct ?? "10–15%"} />
              </div>
            </div>

            {/* Safe media placeholder (no videos required) */}
            <div className="relative">
              <div className="aspect-video w-full overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
                {/* If you add a real video later, swap this image for a <video> or Next Image */}
                {/* This placeholder never breaks the build. */}
                <img
                  src="/hero-fallback.jpg"
                  alt="GSOS overview"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-white/20" />
            </div>
          </div>
        </div>
      </section>

      {/* POSTERS — gracefully degrade if files are missing */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-2xl md:text-3xl font-semibold">
          The Global Trade Crisis: A $32 Trillion Opportunity
          </h2>
        <p className="mt-3 text-gray-700">
          Global trade has shaped civilizations for millennia—from Silk Road
          caravans to chartered companies. Yet today’s $32T ecosystem remains
          fragmented, paper-heavy, and fraud-prone. Annual fraud estimates top
          $50B, the trade finance gap is ~$2.5T, and customs leakages run
          10–15%—systemic drags that hit developing economies hardest.
          India—leader in digital rails—still sees exporters wait 30–90 days for
          payments while SMEs face documentation mistrust.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {posters.map((p) => (
            <PosterCard key={p.alt} src={p.src} alt={p.alt} />
          ))}
        </div>
      </section>

      {/* HOW IT WORKS — JS-free interactive details, so no client bundle needed */}
      <section id="how" className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-2xl md:text-3xl font-semibold">How GSOS Works</h2>
        <div className="mt-6 space-y-4">
          {steps.map((s, idx) => (
            <details
              key={s.key}
              className="group rounded-xl border border-gray-200 p-4 open:bg-gray-50"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-300">
                    {idx + 1}
                  </span>
                  <span className="text-lg font-medium">{s.title}</span>
                </div>
                <svg
                  className="h-5 w-5 transition-transform group-open:rotate-180"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                    clipRule="evenodd"
                  />
                </svg>
              </summary>

              {/* Progress bar purely via CSS (no JS) */}
              <div className="mt-4 h-2 w-full overflow-hidden rounded bg-gray-200">
                <div
                  className="h-full bg-black transition-all duration-700 group-open:w-full w-1/3"
                  aria-hidden
                />
              </div>

              <p className="mt-4 text-gray-700">{s.desc}</p>

              {/* Optional “learn more” link to docs or survey */}
              <div className="mt-4">
                <a
                  className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-100"
                  href={idx === 0 ? "/survey" : "#how"}
                >
                  {idx === 0 ? "Start with the Survey" : "Learn more"}
                </a>
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="rounded-2xl border border-gray-200 p-6 text-center md:p-10">
          <h3 className="text-xl md:text-2xl font-semibold">
            Ready to de-risk & scale your trade ops?
          </h3>
          <p className="mt-2 text-gray-700">
            Take the 5-minute readiness survey and get a grounded action plan.
          </p>
          <a
            href="/survey"
            className="mt-5 inline-flex items-center rounded-lg bg-black px-5 py-3 text-white hover:opacity-90"
          >
            Take the Readiness Survey
          </a>
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 p-4">
      <div className="text-sm text-gray-600">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}

function PosterCard({ src, alt }: { src: string; alt: string }) {
  // We do not assert the file exists—if it’s missing, the <img> fails
  // gracefully and the card still renders.
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200">
      <img src={src} alt={alt} className="h-40 w-full object-cover" />
      <div className="p-4">
        <div className="text-sm text-gray-700">{alt}</div>
      </div>
    </div>
  );
}
