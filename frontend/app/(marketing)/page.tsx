// frontend/app/(marketing)/page.tsx
import Image from "next/image";

// Import client components directly (they have "use client" inside)
import VideoCarousel from "@/components/VideoCarousel";
import GsosStepper from "@/components/Stepper";

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-zinc-900 via-black to-zinc-900 text-white">
        <div className="mx-auto max-w-6xl px-6 py-20 grid gap-10 md:grid-cols-2">
          <div>
            <h1 className="text-4xl md:text-5xl font-semibold leading-tight">
              GSOS — Global Supply Operating System
            </h1>
            <p className="mt-4 text-zinc-300">
              Ingest docs, analyze bottlenecks, act with AI, and scale across markets.
              Built to close the $2.5T trade finance gap and reduce friction in the $32T global trade.
            </p>
            <div className="mt-8 flex gap-3">
              <a
                href="/survey"
                className="rounded-xl bg-white text-black px-5 py-3 font-medium hover:opacity-90"
              >
                Take the Readiness Survey
              </a>
              <a
                href="#how"
                className="rounded-xl border border-zinc-600 px-5 py-3 font-medium hover:bg-zinc-800"
              >
                How GSOS Works
              </a>
            </div>
          </div>

          <div className="relative aspect-video rounded-2xl bg-zinc-800/50 ring-1 ring-zinc-700">
            <div className="absolute inset-4 grid grid-cols-3 gap-3">
              <div className="relative rounded-lg overflow-hidden">
                <Image src="/poster1.png" alt="Poster 1" fill className="object-cover" />
              </div>
              <div className="relative rounded-lg overflow-hidden">
                <Image src="/poster2.png" alt="Poster 2" fill className="object-cover" />
              </div>
              <div className="relative rounded-lg overflow-hidden">
                <Image src="/poster3.png" alt="Poster 3" fill className="object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-14 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border p-6">
            <div className="text-3xl font-semibold">$32T</div>
            <div className="text-zinc-600 mt-1">Global trade size</div>
          </div>
          <div className="rounded-2xl border p-6">
            <div className="text-3xl font-semibold">$2.5T</div>
            <div className="text-zinc-600 mt-1">Trade finance gap</div>
          </div>
          <div className="rounded-2xl border p-6">
            <div className="text-3xl font-semibold">$50B+</div>
            <div className="text-zinc-600 mt-1">Annual trade finance fraud</div>
          </div>
        </div>
      </section>

      {/* VIDEO CAROUSEL (client) */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <h2 className="text-2xl font-semibold">See GSOS in 60 seconds</h2>
          <p className="text-zinc-600 mt-2">
            Overview, how it works, and a quick SME story.
          </p>
          <div className="mt-6">
            <VideoCarousel
              items={[
                { title: "Global Trade & GSOS", src: "/videos/overview.mp4" },
                { title: "How GSOS Works", src: "/videos/how-it-works.mp4" },
                { title: "Retailer SME Story", src: "/videos/customer-story.mp4" },
              ]}
            />
          </div>
        </div>
      </section>

      {/* CRISIS NARRATIVE */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-12 grid gap-8 md:grid-cols-2">
          <div className="rounded-2xl border p-6">
            <h3 className="text-xl font-semibold">The Global Trade Crisis: A $32T Opportunity</h3>
            <p className="text-zinc-700 mt-3">
              Global trade is astonishingly fragmented and paper-heavy. Systemic weaknesses
              cause fraud, financing gaps, and revenue leakage—eroding GDP and hurting developing economies.
            </p>
            <ul className="mt-4 space-y-2 text-zinc-700">
              <li>• $50B+ annual trade finance fraud</li>
              <li>• $2.5T financing gap for legitimate exporters</li>
              <li>• 10–15% customs revenue lost to under-invoicing</li>
            </ul>
            <p className="text-zinc-700 mt-4">
              India leads in digital infra (Aadhaar, UPI) yet exporters wait 30–90 days for payments,
              and SMEs—contributing 45% of exports—face finance exclusion due to documentation mistrust.
            </p>
          </div>

          <div className="rounded-2xl border p-6">
            <h3 className="text-xl font-semibold">GSOS TATHAASTU: Built for Execution</h3>
            <p className="text-zinc-700 mt-3">
              GSOS ingests your data, analyzes bottlenecks, acts with AI, and helps you scale—reducing costs and
              unlocking capital flows with explainable decisioning.
            </p>
            <div className="mt-5">
              <a
                href="/survey"
                className="inline-flex items-center gap-2 rounded-xl bg-black text-white px-5 py-3 hover:opacity-90"
              >
                Start Readiness Survey
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* HOW GSOS WORKS (client) */}
      <section id="how" className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <h2 className="text-2xl font-semibold">How GSOS Works</h2>
          <p className="text-zinc-600 mt-2">
            Four stages—each explainable, and built to connect to your stack.
          </p>
          <div className="mt-6">
            <GsosStepper />
          </div>
        </div>
      </section>
    </main>
  );
}
