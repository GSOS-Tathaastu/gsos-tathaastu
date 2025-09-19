"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";

/** ---------------------------
 *  Lightweight GSOS canvas animation
 *  - Central hub (“GSOS Core”)
 *  - 6 orbiting nodes (Identity, Finance, Logistics, Compliance, Risk, Data)
 *  - Lines drawn each frame; subtle motion for a “living network”
 *  - No external libraries
 * --------------------------- */
function GsosAnimation() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const parentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    let width = 900;
    let height = 460;
    let raf = 0;

    // Resize to parent
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

      // background
      ctx.clearRect(0, 0, width, height);
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, "#f9fafb");
      grad.addColorStop(1, "#eef2ff");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // soft glow around center
      ctx.beginPath();
      const glowGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 180);
      glowGrad.addColorStop(0, "rgba(99,102,241,0.25)");
      glowGrad.addColorStop(1, "rgba(99,102,241,0)");
      ctx.fillStyle = glowGrad;
      ctx.arc(cx, cy, 180, 0, Math.PI * 2);
      ctx.fill();

      // orbits
      const orbitR = Math.min(width, height) * 0.28;
      ctx.strokeStyle = "rgba(99,102,241,0.2)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 6]);
      ctx.beginPath();
      ctx.arc(cx, cy, orbitR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // compute node positions
      const pts = nodes.map((n, i) => {
        const ang =
          ((n.baseAngle + i * 0) * Math.PI) / 180 +
          t * 0.4 + // slow global spin
          Math.sin(t * 0.6 + i) * 0.06; // gentle wobble
        return {
          ...n,
          x: cx + Math.cos(ang) * orbitR,
          y: cy + Math.sin(ang) * orbitR,
          ang,
        };
      });

      // connectors
      ctx.strokeStyle = "rgba(31,41,55,0.25)";
      ctx.lineWidth = 1.5;
      pts.forEach((p) => {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      });

      // center hub
      ctx.beginPath();
      ctx.fillStyle = "#111827";
      ctx.arc(cx, cy, 34, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "white";
      ctx.font = "600 12px Inter, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("GSOS", cx, cy - 7);
      ctx.font = "500 10px Inter, system-ui, sans-serif";
      ctx.fillText("Core", cx, cy + 9);

      // satellite nodes
      pts.forEach((p) => {
        // node circle
        ctx.beginPath();
        ctx.fillStyle = p.color;
        ctx.arc(p.x, p.y, 16, 0, Math.PI * 2);
        ctx.fill();

        // label bg
        const label = p.label;
        ctx.font = "600 12px Inter, system-ui, sans-serif";
        const tw = ctx.measureText(label).width + 16;
        const lh = 22;
        const lx = p.x + Math.cos(p.ang) * 36;
        const ly = p.y + Math.sin(p.ang) * 36;

        ctx.beginPath();
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.strokeStyle = "rgba(31,41,55,0.1)";
        ctx.lineWidth = 1;
        roundRect(ctx, lx - tw / 2, ly - lh / 2, tw, lh, 10);
        ctx.fill();
        ctx.stroke();

        // label text
        ctx.fillStyle = "#111827";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label, lx, ly);
      });

      raf = requestAnimationFrame(draw);
    }

    function roundRect(
      context: CanvasRenderingContext2D,
      x: number,
      y: number,
      w: number,
      h: number,
      r: number
    ) {
      const minR = Math.min(r, w / 2, h / 2);
      context.beginPath();
      context.moveTo(x + minR, y);
      context.arcTo(x + w, y, x + w, y + h, minR);
      context.arcTo(x + w, y + h, x, y + h, minR);
      context.arcTo(x, y + h, x, y, minR);
      context.arcTo(x, y, x + w, y, minR);
      context.closePath();
    }

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <div ref={parentRef} className="w-full rounded-2xl border bg-white p-4 shadow-sm">
      <div className="px-2 pb-3">
        <h3 className="text-lg font-semibold">How GSOS Orchestrates Trust</h3>
        <p className="text-sm text-gray-600">
          A living network: GSOS Core coordinates Identity, Finance, Logistics, Compliance, Risk, and Data—so flows move with
          integrity end-to-end.
        </p>
      </div>
      <canvas ref={ref} className="w-full rounded-xl" />
    </div>
  );
}

/** ---------------------------
 *  Page content
 * --------------------------- */

const EMBEDS_RAW: Record<string, string> = {
  "SME/Manufacturer": `<div id="1758136927773" style="width:100%;max-width:700px;height:525px;margin:auto;display:block;position: relative;border:2px solid #dee1e5;border-radius:3px;"><iframe allow="clipboard-write" allow="autoplay" allowfullscreen="true" style="width:100%;height:100%;border:none;" src="https://app.presentations.ai/view/8LjWOxVDTZ" scrolling="no"></iframe></div>`,
  "Large Corporate": `<div id="1758137329243" style="width:100%;max-width:700px;height:525px;margin:auto;display:block;position: relative;border:2px solid #dee1e5;border-radius:3px;"><iframe allow="clipboard-write" allow="autoplay" allowfullscreen="true" style="width:100%;height:100%;border:none;" src="https://app.presentations.ai/view/fdCcBdRyK3" scrolling="no"></iframe></div>`,
  "Regulator/Policy": `<div id="1758137375839" style="width:100%;max-width:700px;height:525px;margin:auto;display:block;position: relative;border:2px solid #dee1e5;border-radius:3px;"><iframe allow="clipboard-write" allow="autoplay" allowfullscreen="true" style="width:100%;height:100%;border:none;" src="https://app.presentations.ai/view/Igaiv9wz6U" scrolling="no"></iframe></div>`,
  "Logistics/3PL": `<div id="1758137511581" style="width:100%;max-width:700px;height:525px;margin:auto;display:block;position: relative;border:2px solid #dee1e5;border-radius:3px;"><iframe allow="clipboard-write" allow="autoplay" allowfullscreen="true" style="width:100%;height:100%;border:none;" src="https://app.presentations.ai/view/tnCQvh9qPf" scrolling="no"></iframe></div>`,
  "Insurer": `<div id="1758137552481" style="width:100%;max-width:700px;height:525px;margin:auto;display:block;position: relative;border:2px solid #dee1e5;border-radius:3px;"><iframe allow="clipboard-write" allow="autoplay" allowfullscreen="true" style="width:100%;height:100%;border:none;" src="https://app.presentations.ai/view/D3mAUB9Oj0" scrolling="no"></iframe></div>`,
  "Bank/NBFC": `<div id="1758137642142" style="width:100%;max-width:700px;height:525px;margin:auto;display:block;position: relative;border:2px solid #dee1e5;border-radius:3px;"><iframe allow="clipboard-write" allow="autoplay" allowfullscreen="true" style="width:100%;height:100%;border:none;" src="https://app.presentations.ai/view/TsAq0l0QoK" scrolling="no"></iframe></div>`,
  "Broker/Agent": `<div id="1758138205715" style="width:100%;max-width:700px;height:525px;margin:auto;display:block;position: relative;border:2px solid #dee1e5;border-radius:3px;"><iframe allow="clipboard-write" allow="autoplay" allowfullscreen="true" style="width:100%;height:100%;border:none;" src="https://app.presentations.ai/view/HRghuSHeBR" scrolling="no"></iframe></div>`,
  "Retailer/Distributor": `<div id="1758138269254" style="width:100%;max-width:700px;height:525px;margin:auto;display:block;position: relative;border:2px solid #dee1e5;border-radius:3px;"><iframe allow="clipboard-write" allow="autoplay" allowfullscreen="true" style="width:100%;height:100%;border:none;" src="https://app.presentations.ai/view/5Jt7OfswCI" scrolling="no"></iframe></div>`,
};

function CtaRow({ items }: { items: { href: string; label: string; variant?: "solid" | "outline" }[] }) {
  return (
    <div className="mt-4 flex flex-wrap gap-3">
      {items.map((b) => (
        <Link
          key={b.href + b.label}
          href={b.href}
          className={
            "rounded-xl px-5 py-2.5 text-sm transition " +
            (b.variant === "outline"
              ? "border hover:bg-gray-50"
              : "bg-black text-white hover:bg-gray-900")
          }
        >
          {b.label}
        </Link>
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:py-10 space-y-16">

      {/* HERO */}
      <section className="rounded-2xl bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-700 text-white p-8 md:p-12 shadow-sm">
        <div className="max-w-3xl">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            GSOS TATHAASTU — The Nervous System of Global Trade
          </h1>
          <p className="mt-3 text-white/90 text-base md:text-lg">
            Orchestrate identity, finance, logistics, and compliance so flows move with trust and speed across borders.
          </p>
          <CtaRow
            items={[
              { href: "/start", label: "Start the survey" },
              { href: "/modules", label: "Explore modules", variant: "outline" },
              { href: "/investors", label: "Investor brief", variant: "outline" },
            ]}
          />
        </div>
      </section>

      {/* LIVE GSOS ANIMATION */}
      <GsosAnimation />

      {/* IMAGE SECTIONS + CTAS */}
      <section>
        <Image
          src="/Beyond-Trade-The-Platform-for-Global-Economic-Trust.png"
          alt="Beyond Trade: The Platform for Global Economic Trust"
          width={1600}
          height={1066}
          className="rounded-xl shadow-md w-full h-auto"
          priority
        />
        <CtaRow
          items={[
            { href: "/start", label: "Get my tailored plan" },
            { href: "/contact", label: "Talk to us", variant: "outline" },
          ]}
        />
      </section>

      <section>
        <Image
          src="/The-Reality-Check-Supply-Chain-Fragmentation.png"
          alt="The Reality Check: Supply Chain Fragmentation"
          width={1600}
          height={1066}
          className="rounded-xl shadow-md w-full h-auto"
        />
        <CtaRow
          items={[
            { href: "/modules", label: "See how we fix this" },
            { href: "/start", label: "Start assessment", variant: "outline" },
          ]}
        />
      </section>

      <section>
        <Image
          src="/Supply-Chains-Dont-Need-Another-Tool-They-Need-an-Operating-System.png"
          alt="Supply Chains need an Operating System"
          width={1600}
          height={1066}
          className="rounded-xl shadow-md w-full h-auto"
        />
        <CtaRow
          items={[
            { href: "/how-it-works", label: "How it works" },
            { href: "/start", label: "Estimate ROI", variant: "outline" },
          ]}
        />
      </section>

      <section className="text-center">
        <Image
          src="/ChatGPT Image Sep 2, 2025, 12_11_30 PM.png"
          alt="TATHAASTU — Logo / Tagline"
          width={800}
          height={800}
          className="rounded-xl shadow-md inline-block"
        />
        <CtaRow
          items={[
            { href: "/start", label: "Begin assessment" },
            { href: "/contact", label: "Contact", variant: "outline" },
          ]}
        />
      </section>

      {/* STAKEHOLDER EMBEDS */}
      <section className="space-y-8">
        <h2 className="text-2xl md:text-3xl font-bold text-center">Stakeholder Stories</h2>
        <p className="text-center text-gray-600 max-w-2xl mx-auto">
          Short explainers tailored to each stakeholder. Pick one and dive in.
        </p>
        <div className="grid gap-10">
          {Object.entries(EMBEDS_RAW).map(([key, html]) => (
            <div key={key} className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{key}</h3>
                <Link href="/start" className="text-sm underline">
                  Get my tailored plan →
                </Link>
              </div>
              <div className="mt-3" dangerouslySetInnerHTML={{ __html: html }} />
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section>
        <div className="rounded-2xl border bg-indigo-50 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold">Ready to orchestrate your trade flows?</h3>
              <p className="text-gray-700">2-minute survey → modules & ROI estimate.</p>
            </div>
            <div className="flex gap-3">
              <Link href="/start" className="rounded-xl bg-indigo-700 px-5 py-2.5 text-white">
                Start the survey
              </Link>
              <Link href="/contact" className="rounded-xl border px-5 py-2.5">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
