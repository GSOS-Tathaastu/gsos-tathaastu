"use client";
import { useMemo, useRef, useState } from "react";

const CATEGORY_MAP: Record<string, string[]> = {
  retailer: ["Owner/Founder","COO/Operations","Supply Chain Head","Demand Planner","Inventory Manager","Omnichannel Lead","Category Manager","Store Ops"],
  distributor: ["Owner/Founder","Regional Manager","Supply Chain Head","Demand Planner","Warehousing Head","Route Planning"],
  manufacturer: ["COO/Operations","S&OP Manager","Production Planner","Procurement","Quality","Plant Logistics"],
  logistics: ["3PL Ops","4PL Ops","Line-haul","Last-mile","Cross-border","Customs/Compliance"],
  ecommerce: ["Marketplace Ops","D2C Ops","Catalog/Listing","Fulfillment","Returns/Reverse"],
  finance: ["CFO/Finance","Controller","AP/AR","Working Capital"],
  importer_exporter: ["Export Ops","Import Ops","Freight Forwarding","Customs Brokerage"],
};

const B2B_OPTS = ["Udaan","IndiaMART","TradeIndia","Walmart/Flipkart Wholesale","JioMart Partner","Other"];
const B2C_OPTS = ["Amazon","Flipkart","Meesho","Shopify (D2C)","WooCommerce (D2C)","Myntra","Nykaa","Ajio","Other"];

const toTitle = (s: string) => s.replace(/[_-]+/g," ").replace(/\b\w/g, c => c.toUpperCase());

export default function StepZeroCompany() {
  const [form, setForm] = useState({
    companyName: "", website: "", contactName: "", email: "", phone: "",
    roleMain: "retailer", roleSub: "",
    country: "India", preferredCurrency: "INR",
    aboutCompany: "", products: "",
    annualRevenue: "", annualRevenueCurrency: "INR",
    painAreas: "",
    revenueGlobalPct: 0,
    consent: true,
    b2bPlatforms: [] as string[],
    b2cPlatforms: [] as string[],
    otherPlatform: "",
  });
  const [status, setStatus] = useState<{ loading:boolean; ok:boolean; err:string; reasons:string[] }>({ loading:false, ok:false, err:"", reasons:[] });
  const topRef = useRef<HTMLDivElement>(null);

  const subOptions = useMemo(() => CATEGORY_MAP[form.roleMain] || [], [form.roleMain]);
  const revenueDomesticPct = useMemo(() => Math.max(0, Math.min(100, 100 - Number(form.revenueGlobalPct || 0))), [form.revenueGlobalPct]);

  const update = (k: string) => (e: any) => {
    const v = e?.target?.type === "checkbox" ? !!e.target.checked : e?.target?.value ?? e;
    setForm((f:any) => ({ ...f, [k]: v }));
  };
  const updateArray = (k: "b2bPlatforms" | "b2cPlatforms", val: string, checked: boolean) => {
    setForm((f:any) => {
      const arr = new Set<string>(f[k] || []);
      checked ? arr.add(val) : arr.delete(val);
      return { ...f, [k]: Array.from(arr) };
    });
  };

  const validate = () => {
    const reasons: string[] = [];
    if (!form.companyName.trim()) reasons.push("Company Name is required.");
    if (!form.contactName.trim()) reasons.push("Contact Person is required.");
    if (!/^\S+@\S+\.\S+$/.test(form.email)) reasons.push("Valid Email is required.");
    if (!form.roleMain) reasons.push("Main Category is required.");
    if (!form.roleSub) reasons.push("Subcategory/Position is required.");
    if (!form.aboutCompany.trim()) reasons.push("About Company is required.");
    if (!form.products.trim()) reasons.push("Products are required.");
    if (Number(form.revenueGlobalPct) < 0 || Number(form.revenueGlobalPct) > 100) reasons.push("Global Revenue % must be between 0 and 100.");
    if ((form.b2bPlatforms.includes("Other") || form.b2cPlatforms.includes("Other")) && !form.otherPlatform.trim()) {
      reasons.push("Please specify the Other platform.");
    }
    return reasons;
  };

  const submit = async (e: any) => {
    e.preventDefault();
    const reasons = validate();
    if (reasons.length) {
      setStatus({ loading:false, ok:false, err:"Please fix the highlighted issues.", reasons });
      topRef.current?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    setStatus({ loading:true, ok:false, err:"", reasons:[] });
    try {
      const payload = { ...form, role: form.roleMain };
      const res = await fetch("/api/company/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save");

      // store onboarding for Survey
      if (json.onboarding) sessionStorage.setItem("onboarding", JSON.stringify(json.onboarding));
      setStatus({ loading:false, ok:true, err:"", reasons:[] });
      if (json.next) window.location.assign(json.next);
    } catch (err:any) {
      setStatus({ loading:false, ok:false, err: err.message, reasons:[] });
      topRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 border rounded-2xl p-4 bg-white">
      <div ref={topRef} />
      <h3 className="text-lg font-semibold">Company Details (Step-0)</h3>

      { (status.err || status.reasons.length>0) && (
        <div className="border border-red-300 bg-red-50 text-red-800 p-3 rounded">
          <div className="font-medium">{status.err || "Please fix the following:"}</div>
          {status.reasons.length>0 && (
            <ul className="list-disc ml-5 mt-1 text-sm">
              {status.reasons.map((r,i)=>(<li key={i}>{r}</li>))}
            </ul>
          )}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-3">
        <input className="p-2 rounded border" placeholder="Company Name *" value={form.companyName} onChange={update("companyName")} />
        <input className="p-2 rounded border" placeholder="Website (https://)" value={form.website} onChange={update("website")} />
        <input className="p-2 rounded border" placeholder="Contact Person *" value={form.contactName} onChange={update("contactName")} />
        <input className="p-2 rounded border" type="email" placeholder="Email *" value={form.email} onChange={update("email")} />
        <input className="p-2 rounded border" placeholder="Phone" value={form.phone} onChange={update("phone")} />

        {/* Main/Sub with Title Case labels */}
        <div className="p-2 rounded border">
          <label className="text-xs block mb-1 opacity-70">Main Category *</label>
          <select className="w-full" value={form.roleMain} onChange={(e)=>{ update("roleMain")(e); update("roleSub")({target:{value:""}}); }}>
            {Object.keys(CATEGORY_MAP).map(k => (<option key={k} value={k}>{toTitle(k)}</option>))}
          </select>
        </div>
        <div className="p-2 rounded border">
          <label className="text-xs block mb-1 opacity-70">Subcategory / Position *</label>
          <select className="w-full" value={form.roleSub} onChange={update("roleSub")}>
            <option value="">-- Select --</option>
            {subOptions.map(s => (<option key={s} value={s}>{toTitle(s)}</option>))}
          </select>
        </div>

        <input className="p-2 rounded border" placeholder="Country" value={form.country} onChange={update("country")} />
        <input className="p-2 rounded border" placeholder="Preferred Currency (e.g., INR)" value={form.preferredCurrency} onChange={update("preferredCurrency")} />
      </div>

      {/* Business Context */}
      <div className="grid md:grid-cols-2 gap-3">
        <textarea className="p-2 rounded border md:col-span-2" rows={3} placeholder="About your company *" value={form.aboutCompany} onChange={update("aboutCompany")} />
        <textarea className="p-2 rounded border md:col-span-2" rows={2} placeholder="Products you deal in *" value={form.products} onChange={update("products")} />

        <div className="p-2 rounded border">
          <label className="text-xs block mb-1 opacity-70">Annual Revenue</label>
          <input className="w-full" type="number" min="0" step="0.01" value={form.annualRevenue} onChange={update("annualRevenue")} />
        </div>
        <div className="p-2 rounded border">
          <label className="text-xs block mb-1 opacity-70">Revenue Currency</label>
          <input className="w-full" value={form.annualRevenueCurrency} onChange={update("annualRevenueCurrency")} />
        </div>

        <textarea className="p-2 rounded border md:col-span-2" rows={2} placeholder="Top pain areas (comma-separated)" value={form.painAreas} onChange={update("painAreas")} />

        <div className="p-2 rounded border">
          <label className="text-xs block mb-1 opacity-70">Global Revenue %</label>
          <input className="w-full" type="number" min="0" max="100" step="1" value={form.revenueGlobalPct} onChange={update("revenueGlobalPct")} />
        </div>
        <div className="p-2 rounded border">
          <label className="text-xs block mb-1 opacity-70">Domestic Revenue %</label>
          <input className="w-full bg-gray-100" value={revenueDomesticPct} readOnly />
        </div>
      </div>

      {/* Platforms */}
      <div className="grid md:grid-cols-2 gap-3">
        <div className="p-2 rounded border">
          <div className="text-sm font-medium mb-1">B2B Platforms</div>
          <div className="flex flex-wrap gap-3">
            {B2B_OPTS.map(op => (
              <label key={op} className="text-sm">
                <input type="checkbox" checked={form.b2bPlatforms.includes(op)} onChange={(e)=>updateArray("b2bPlatforms", op, e.target.checked)} /> <span className="ml-1">{op}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="p-2 rounded border">
          <div className="text-sm font-medium mb-1">B2C Platforms</div>
          <div className="flex flex-wrap gap-3">
            {B2C_OPTS.map(op => (
              <label key={op} className="text-sm">
                <input type="checkbox" checked={form.b2cPlatforms.includes(op)} onChange={(e)=>updateArray("b2cPlatforms", op, e.target.checked)} /> <span className="ml-1">{op}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
      {(form.b2bPlatforms.includes("Other") || form.b2cPlatforms.includes("Other")) && (
        <input className="p-2 rounded border w-full" placeholder="Please specify other platform" value={form.otherPlatform} onChange={update("otherPlatform")} />
      )}

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.consent} onChange={update("consent")} /> I consent to be contacted regarding GSOS-TATHAASTU.
      </label>

      <button disabled={status.loading} className="px-4 py-2 rounded-xl bg-black text-white">
        {status.loading ? "Saving…" : "Save & Continue"}
      </button>
      {status.ok && <div className="text-green-600 text-sm">Saved! Redirecting…</div>}
    </form>
  );
}
