import React from "react";
import Image from "next/image";
import WorldBankPanel from "../src/components/WorldBankPanel";
import TradeSummary from "../src/components/TradeSummary";

export default function Home() {
  return (
    <main className="min-h-screen p-6 space-y-8">
      <section>
        <h1 className="text-3xl font-bold">GSOS-TATHAASTU</h1>
        <p className="text-gray-600 mt-1">
          Operating system for trade & supply chains.
        </p>
      </section>

      {/* Uploaded homepage images */}
      <section className="grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl overflow-hidden border">
          <Image
            src="/images/home-1.png" // change if filename differs
            alt="GSOS overview"
            width={1600}
            height={900}
            priority
            className="w-full h-auto"
          />
        </div>
        <div className="rounded-2xl overflow-hidden border">
          <Image
            src="/images/home-2.png" // change if filename differs
            alt="GSOS pipeline"
            width={1600}
            height={900}
            className="w-full h-auto"
          />
        </div>
      </section>

      {/* World Bank multi-country data */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">World Bank — Compare Countries</h2>
        <WorldBankPanel />
      </section>

      {/* UN Comtrade global trade snapshot */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Global Trade Snapshot (UN Comtrade)</h2>
        <TradeSummary />
      </section>
    </main>
  );
}
