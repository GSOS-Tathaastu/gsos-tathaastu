// frontend/components/StepZeroCompany.jsx
"use client";
import { useState } from "react";

const MAIN_ROLES = ["retailer","distributor","manufacturer","logistics","finance","middlemen"];
const SUB_ROLES_BY_MAIN = {
  retailer: ["Owner","Merchandiser","Planner","Store Manager","Founder","Director","Proprietor"],
  distributor: ["Owner","Regional Head","Planner","Founder","Director","Proprietor"],
  manufacturer: ["Owner","Plant Head","SCM Head","Founder","Director","Proprietor"],
  logistics: ["Owner","Ops Head","Founder","Director","Proprietor"],
  finance: ["Owner","CFO","Treasury","Founder","Director","Proprietor"],
  middlemen: ["Owner","Broker","Agent","Founder","Director","Proprietor"]
};

export default function StepZeroCompany({ onSaved }) {
  const [form, setForm] = useState({
    companyName: "",
    website: "",
    contactName: "",
    email: "",
    phone: "",
    roleMain: "retailer",
    roleSub: "",
    country: "India",
    preferredCurrency: "INR",
    b2bPlatforms: [],
    b2cPlatforms: [],
    otherPlatform: "",
    consent: true,
  });
  const [status, setStatus] = useState({ loading: false, ok: false, err: "" });

  const update = (k) => (e) =>
    setForm((f) => ({
      ...f,
      [k]: e?.target?.type === "checkbox" ? e.target.checked : e?.target?.value ?? e
    }));

  const submit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, ok: false, err: "" });
    try {
      if (!form.companyName || !form.contactName || !form.email) {
        throw new Error("Please fill Company, Contact, and Email.");
      }
      const res = await fetch("/api/company/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          companyName: form.companyName,
          website: form.website,
          contactName: form.contactName,
          email: form.email,
          phone: form.phone,
          role: form.roleMain,
          country: form.country,
          preferredCurrency: form.preferredCurrency,
          b2bPlatforms: form.b2bPlatforms,
          b2cPlatforms: form.b2cPlatforms,
          otherPlatform: form.otherPlatform,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save");

      const onboarding = {
        companyName: form.companyName,
        website: form.website,
        contactName: form.contactName,
        email: form.email,
        phone: form.phone,
        role: form.roleMain,
        roleMain: form.roleMain,
        roleSub: form.roleSub,
        country: form.country,
        currency: form.preferredCurrency || "INR",
        b2bPlatforms: form.b2bPlatforms || [],
        b2cPlatforms: form.b2cPlatforms || [],
        otherPlatform: form.otherPlatform || "",
        savedAt: new Date().toISOString(),
      };
      sessionStorage.setItem("onboarding", JSON.stringify(onboarding));

      setStatus({ loading: false, ok: true, err: "" });
      onSaved && onSaved(json);
      window.location.href = "/survey";
    } catch (e) {
      setStatus({ loading: false, ok: false, err: e.message || String(e) });
    }
  };

  const subOptions = SUB_ROLES_BY_MAIN[form.roleMain] || [];

  return (
    <form onSubmit={submit} className="space-y-3 border rounded-2xl p-4 bg-white/70 dark:bg-zinc-900/60">
      <h3 className="text-lg font-semibold">Company Details (Step-0)</h3>
      <div className="grid md:grid-cols-2 gap-3">
        <input className="p-2 rounded border" placeholder="Company Name" value={form.companyName} onChange={update("companyName")} required />
        <input className="p-2 rounded border" placeholder="Website (https://)" value={form.website} onChange={update("website")} />
        <input className="p-2 rounded border" placeholder="Contact Person" value={form.contactName} onChange={update("contactName")} required />
        <input className="p-2 rounded border" type="email" placeholder="Email" value={form.email} onChange={update("email")} required />
        <input className="p-2 rounded border" placeholder="Phone" value={form.phone} onChange={update("phone")} />

        {/* Main role */}
        <select
          className="p-2 rounded border"
          value={form.roleMain}
          onChange={(e)=>setForm(f=>({...f, roleMain: e.target.value, roleSub: ""}))}
        >
          {MAIN_ROLES.map(x => (
            <option key={x} value={x}>{x.charAt(0).toUpperCase()+x.slice(1)}</option>
          ))}
        </select>

        {/* Sub role */}
        <select
          className="p-2 rounded border"
          value={form.roleSub}
          onChange={update("roleSub")}
        >
          <option value="">Select sub-role (optional)</option>
          {subOptions.map(x => (
            <option key={x} value={x}>{x}</option>
          ))}
        </select>

        <input className="p-2 rounded border" placeholder="Country" value={form.country} onChange={update("country")} />
        <input className="p-2 rounded border" placeholder="Preferred Currency (e.g., INR)" value={form.preferredCurrency} onChange={update("preferredCurrency")} />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.consent} onChange={update("consent")} /> I consent to be contacted regarding GSOS-TATHAASTU.
      </label>

      <button disabled={status.loading} className="px-4 py-2 rounded-xl bg-black text-white">
        {status.loading ? "Saving…" : "Save & Continue"}
      </button>
      {status.ok && <div className="text-green-600 text-sm">Saved! Redirecting…</div>}
      {status.err && <div className="text-red-600 text-sm">{status.err}</div>}
    </form>
  );
}
