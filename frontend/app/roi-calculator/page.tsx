// frontend/app/roi-calculator/page.tsx
"use client";
import { useEffect, useMemo, useState } from "react";

export default function ROICalc() {
  const [revenue, setRevenue] = useState<number>(100);
  const [grossMargin, setGM] = useState<number>(35);
  const [stockoutRate, setSO] = useState<number>(8);
  const [overstockRate, setOS] = useState<number>(12);
  const [platforms, setPlatforms] = useState<string[]>([]);

  useEffect(() => {
    const ob = sessionStorage.getItem("onboarding");
    if (ob) {
      const o = JSON.parse(ob);
      const all = [...(o.b2bPlatforms || []), ...(o.b2cPlatforms || [])];
      setPlatforms(all);
    }
  }, []);

  const upliftPct = useMemo(() => {
    let u = 3;
    if (platforms.includes("Amazon")) u += 2;
    if (platforms.includes("Flipkart")) u += 1.5;
    if (platforms.find(p => /Shopify|WooCommerce/.test(p))) u += 1;
    return u;
  }, [platforms]);

  const reducedSO = Math.max(0, stockoutRate - 3);
  const reducedOS = Math.max(0, overstockRate - 4);

  const addedRevenue = (revenue * upliftPct) / 100;
  const marginGain = addedRevenue * (grossMargin / 100);
  const wcRelease = (revenue * (overstockRate - reducedOS)) / 100;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">ROI Calculator</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="border rounded-2xl p-4">
          <label className="text-sm block">Annual Revenue (₹ Cr)</label>
          <input type="number" className="border rounded p-2 w-full" value={revenue} onChange={e=>setRevenue(Number(e.target.value))} />
          <label className="text-sm block mt-2">Gross Margin %</label>
          <input type="number" className="border rounded p-2 w-full" value={grossMargin} onChange={e=>setGM(Number(e.target.value))} />
          <label className="text-sm block mt-2">Stockout Rate %</label>
          <input type="number" className="border rounded p-2 w-full" value={stockoutRate} onChange={e=>setSO(Number(e.target.value))} />
          <label className="text-sm block mt-2">Overstock Rate %</label>
          <input type="number" className="border rounded p-2 w-full" value={overstockRate} onChange={e=>setOS(Number(e.target.value))} />
          <div className="text-xs opacity-60 mt-2">Detected platforms: {platforms.join(", ") || "—"}</div>
        </div>
        <div className="border rounded-2xl p-4">
          <div className="font-semibold">Estimated Impact</div>
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li>Revenue uplift: <b>{upliftPct.toFixed(1)}%</b> (~₹{addedRevenue.toFixed(2)} Cr)</li>
            <li>Margin gain: <b>₹{marginGain.toFixed(2)} Cr</b></li>
            <li>Working capital release (less overstock): <b>₹{wcRelease.toFixed(2)} Cr</b></li>
          </ul>
          <div className="text-xs opacity-60 mt-2">Assumptions are conservative and configurable later.</div>
        </div>
      </div>
    </div>
  );
}
