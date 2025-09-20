"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import GsosAnimation from "@/components/GsosAnimation"; // ← keep this import
// (TradeKpiSection removed per your request)

/* -------------------------
   Stakeholder Stories Tabs
-------------------------- */
const EMBEDS: Record<string, string> = {
  SME: `<iframe style="width:100%;height:500px;border:none;" src="https://app.presentations.ai/view/8LjWOxVDTZ"></iframe>`,
  Corporate: `<iframe style="width:100%;height:500px;border:none;" src="https://app.presentations.ai/view/fdCcBdRyK3"></iframe>`,
  Regulator: `<iframe style="width:100%;height:500px;border:none;" src="https://app.presentations.ai/view/Igaiv9wz6U"></iframe>`,
  Logistics: `<iframe style="width:100%;height:500px;border:none;" src="https://app.presentations.ai/view/tnCQvh9qPf"></iframe>`,
  Insurer: `<iframe style="width:100%;height:500px;border:none;" src="https://app.presentations.ai/view/D3mAUB9Oj0"></iframe>`,
  Bank: `<iframe style="width:100%;height:500px;border:none;" src="https://app.presentations.ai/view/TsAq0l0QoK"></iframe>`,
  Broker: `<iframe style="width:100%;height:500px;border:none;" src="https://app.presentations.ai/view/HRghuSHeBR"></iframe>`,
  Retailer: `<iframe style="width:100%;height:500px;border:none;" src="https://app.presentations.ai/view/5Jt7OfswCI"></iframe>`,
};

function StakeholderTabs() {
  const [active, setActive] = useState<keyof typeof EMBEDS>("SME");
  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold text-center mb-6">Stakeholder Stories</h2>
      <div className="flex flex-wrap justify-center gap-3 mb-6">
        {Object.keys(EMBEDS).map((k) => (
          <button
            key={k}
            onClick={() => setActive(k as keyof typeof EMBEDS)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              active === k
                ? "bg-indigo-600 text-white shadow"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {k}
          </button>
        ))}
      </div>
      <div
        className="rounded-2xl border bg-white shadow-sm p-4"
        dangerouslySetInnerHTML={{ __html: EMBEDS[active] }}
      />
    </div>
  );
}

/* -------------------------
   WHY NOW Section
-------------------------- */
function WhyNow() {
  return (
    <section className="rounded-2xl border bg-white shadow p-6 space-y-4">
      <h2 className="text-2xl font-bold text-center">Why Now?</h2>
      <p className="text-center text-gray-600 max-w-2xl mx-auto">
        Global trade is at an inflection point: digitization, compliance,
        financing gaps, and resilience needs make GSOS timely.
      </p>
      <div
        className="mt-4"
        dangerouslySetInnerHTML={{
          __html: `<div style="width:100%;max-width:700px;height:525px;margin:auto;"><iframe allowfullscreen style="width:100%;height:100%;border:none;" src="https://app.presentations.ai/view/csx0tIFvuN" scrolling="no"></iframe></div>`,
        }}
      />
    </section>
  );
}

/* -------------------------
   Home Page
-------------------------- */
export default function HomePage() {
  return (
    <div className="bg-gradient-to-b from-gray-50 via-indigo-50 to-white">
      <div className="mx-auto max-w-6xl px-4 py-10 space-y-16">
        {/* HERO */}
        <section className="text-center space-y-6">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-gray-900">
            GSOS TATHAASTU
          </h1>
          <p className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto">
            The Nervous System of Global Trade — orchestrating identity, finance,
            logistics, and compliance end-to-end.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/start"
              className="rounded-xl bg-indigo-600 px-6 py-3 text-white font-semibold hover:bg-indigo-700"
            >
              Start Survey
            </Link>
            <Link
              href="/investors"
              className="rounded-xl border px-6 py-3 text-gray-700 hover:bg-gray-100"
            >
              Investor Brief
            </Link>
          </div>
        </section>

        {/* ANIMATION (imported component) */}
        <GsosAnimation />

        {/* REALITY CHECK IMAGE (ensure this file exists in /public) */}
        <section>
          <Image
            src="/The-Reality-Check-Supply-Chain-Fragmentation.png"
            alt="Supply Chain Fragmentation"
            width={1600}
            height={1066}
            className="rounded-xl shadow-md w-full h-auto"
          />
        </section>

        {/* LOGO / TAGLINE (use a safe filename in /public) */}
        <section className="text-center">
          <Image
            src="/tathaastu-logo.png"
            alt="TATHAASTU Logo"
            width={600}
            height={600}
            className="mx-auto rounded-xl shadow-md"
          />
        </section>

        {/* WHY NOW */}
        <WhyNow />

        {/* STAKEHOLDER STORIES */}
        <StakeholderTabs />
      </div>
    </div>
  );
}
