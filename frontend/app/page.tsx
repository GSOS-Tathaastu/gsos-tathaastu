"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

/* -------------------------
   GSOS Orbit Animation
-------------------------- */
function GsosAnimation() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const parentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    let width = 900;
    let height = 460;
    let raf = 0;

    function resize() {
      const w = parentRef.current?.clientWidth ?? 900;
      width = Math.min(1100, Math.max(640, w));
      height = Math.round(width * 0.5);
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    const ro = new ResizeObserver(resize);
    if (parentRef.current) ro.observe(parentRef.current);

    const center = () => ({ x: width / 2, y: height / 2 });

    const nodes = [
      { label: "Identity", color: "#22c55e", baseAngle: 0 },
      { label: "Finance", color: "#f59e0b", baseAngle: 60 },
      { label: "Logistics", color: "#3b82f6", baseAngle: 120 },
      { label: "Compliance", color: "#8b5cf6", baseAngle: 180 },
      { label: "Risk", color: "#ef4444", baseAngle: 240 },
      { label: "Data", color: "#06b6d4", baseAngle: 300 },
    ];

    function draw(now: number) {
      const t = now / 1000;
      const { x: cx, y: cy } = center();
      ctx.clearRect(0, 0, width, height);

      const orbitR = Math.min(width, height) * 0.28;
      const pts = nodes.map((n, i) => {
        const ang =
          ((n.baseAngle + i * 0) * Math.PI) / 180 +
          t * 0.4 +
          Math.sin(t * 0.6 + i) * 0.06;
        return {
          ...n,
          x: cx + Math.cos(ang) * orbitR,
          y: cy + Math.sin(ang) * orbitR,
          ang,
        };
      });

      // center hub
      ctx.beginPath();
      ctx.fillStyle = "#111827";
      ctx.arc(cx, cy, 34, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "white";
      ctx.font = "600 12px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("GSOS", cx, cy - 7);
      ctx.font = "500 10px Inter, sans-serif";
      ctx.fillText("Core", cx, cy + 9);

      pts.forEach((p) => {
        ctx.beginPath();
        ctx.fillStyle = p.color;
        ctx.arc(p.x, p.y, 16, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#111827";
        ctx.font = "600 12px Inter, sans-serif";
        ctx.fillText(p.label, p.x, p.y + 30);
      });

      raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <div
      ref={parentRef}
      className="w-full rounded-2xl border bg-white shadow-sm p-4"
    >
      <h3 className="text-xl font-semibold mb-2 text-gray-900">
        How GSOS Orchestrates Trust
      </h3>
      <canvas ref={ref} className="w-full rounded-xl" />
    </div>
  );
}

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
                ? "bg-indigo-600 text-white"
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
    <section className="rounded-2xl border bg-white shadow-sm p-6 space-y-4">
      <h2 className="text-2xl font-bold text-center">Why Now?</h2>
      <p className="text-center text-gray-600 max-w-2xl mx-auto">
        Global trade is at an inflection point: digitization, compliance,
        financing gaps, and resilience needs make GSOS timely.
      </p>
      <div
        className="mt-4"
        dangerouslySetInnerHTML={{
          __html: `<div id="1758290693853" style="width:100%;max-width:700px;height:525px;margin:auto;"><iframe allow="clipboard-write" allow="autoplay" allowfullscreen style="width:100%;height:100%;border:none;" src="https://app.presentations.ai/view/csx0tIFvuN" scrolling="no"></iframe></div>`,
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

        {/* ANIMATION */}
        <GsosAnimation />

        {/* REALITY CHECK IMAGE */}
        <section>
          <Image
            src="/The-Reality-Check-Supply-Chain-Fragmentation.png"
            alt="Supply Chain Fragmentation"
            width={1600}
            height={1066}
            className="rounded-xl shadow-md w-full h-auto"
          />
        </section>

        {/* LOGO / TAGLINE */}
        <section className="text-center">
          <Image
            src="/ChatGPT Image Sep 2, 2025, 12_11_30 PM.png"
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
