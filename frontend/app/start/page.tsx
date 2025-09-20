"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/** Main role → sub-roles */
const ROLE_MAIN = {
  SME: ["Manufacturer", "Trader", "Exporter", "Importer"],
  Corporate: ["MNC", "Large Enterprise", "Conglomerate"],
  Logistics: ["Freight Forwarder", "3PL", "Customs Broker"],
  Finance: ["Bank", "NBFC", "Fintech"],
  Insurer: ["Trade Credit", "Marine Cargo", "General"],
  Regulator: ["Customs", "DGFT", "Central Bank"],
  Broker: ["Agent", "Middleman", "Distributor"],
  Retailer: ["Wholesale", "Retail Chain", "E-Commerce"],
} as const;

type MainRole = keyof typeof ROLE_MAIN;

export default function StartPage() {
  const router = useRouter();

  // form state
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [mainRole, setMainRole] = useState<MainRole | "">("");
  const [subRole, setSubRole] = useState("");
  const [revenue, setRevenue] = useState("");
  const [employees, setEmployees] = useState("");
  const [operations, setOperations] = useState("");
  const [yearsActive, setYearsActive] = useState("");

  // ui state
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // hydrate from localStorage
  useEffect(() => {
    try {
      setCompany(localStorage.getItem("gsos_company") || "");
      setEmail(localStorage.getItem("gsos_email") || "");
      setCountry(localStorage.getItem("gsos_country") || "");
      setMainRole((localStorage.getItem("gsos_roleMain") as MainRole) || "");
      setSubRole(localStorage.getItem("gsos_roleSub") || "");
      setRevenue(localStorage.getItem("gsos_revenue") || "");
      setEmployees(localStorage.getItem("gsos_employees") || "");
      setOperations(localStorage.getItem("gsos_operations") || "");
      setYearsActive(localStorage.getItem("gsos_yearsActive") || "");
    } catch {}
  }, []);

  function persist() {
    localStorage.setItem("gsos_company", company);
    localStorage.setItem("gsos_email", email.toLowerCase());
    localStorage.setItem("gsos_country", country);
    localStorage.setItem("gsos_roleMain", String(mainRole));
    localStorage.setItem("gsos_roleSub", subRole);
    localStorage.setItem("gsos_revenue", revenue);
    localStorage.setItem("gsos_employees", employees);
    localStorage.setItem("gsos_operations", operations);
    localStorage.setItem("gsos_yearsActive", yearsActive);
  }

  async function handleStart(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!company || !email || !country || !mainRole || !subRole) {
      setErr("Please complete all required fields.");
      return;
    }

    setLoading(true);
    try {
      // persist locally first (so generator can be re-called if user refreshes)
      persist();

      // call survey generator (AI + chunks behind the scenes)
      const resp = await fetch("/api/survey/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company,
          email,
          country,
          roleMain: mainRole,   // ← server expects roleMain
          roleSub: subRole,     // ← and roleSub
          revenue,
          employees,
          operations,
          yearsActive,
        }),
      });

      const data = await resp.json().catch(() => ({} as any));
      if (!resp.ok || !data?.ok) {
        throw new Error(data?.error || `Generator failed (HTTP ${resp.status})`);
      }

      const sid = data.sessionId || data.sid;
      if (!sid) throw new Error("No sessionId returned by generator.");

      localStorage.setItem("gsos_session", sid);
      router.push(`/survey?sessionId=${encodeURIComponent(sid)}`);
    } catch (e: any) {
      setErr(e?.message || "Failed to start survey.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    [
      "gsos_company",
      "gsos_email",
      "gsos_country",
      "gsos_roleMain",
      "gsos_roleSub",
      "gsos_revenue",
      "gsos_employees",
      "gsos_operations",
      "gsos_yearsActive",
      "gsos_session",
    ].forEach((k) => localStorage.removeItem(k));
    setCompany("");
    setEmail("");
    setCountry("");
    setMainRole("");
    setSubRole("");
    setRevenue("");
    setEmployees("");
    setOperations("");
    setYearsActive("");
    setErr(null);
  }

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Step-0: Tell us about your business</h1>

      <form onSubmit={handleStart} className="space-y-5 rounded-xl border bg-white p-6 shadow">
        {err && <div className="text-red-600">{err}</div>}

        <div>
          <label className="block text-sm font-medium">Company Name *</label>
          <input className="w-full rounded border p-2" value={company} onChange={(e) => setCompany(e.target.value)} />
        </div>

        <div>
          <label className="block text-sm font-medium">Contact Email *</label>
          <input type="email" className="w-full rounded border p-2" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div>
          <label className="block text-sm font-medium">Country *</label>
          <input className="w-full rounded border p-2" value={country} onChange={(e) => setCountry(e.target.value)} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Main Role *</label>
            <select
              className="w-full rounded border p-2"
              value={mainRole}
              onChange={(e) => {
                setMainRole(e.target.value as MainRole);
                setSubRole("");
              }}
            >
              <option value="">Select</option>
              {(Object.keys(ROLE_MAIN) as MainRole[]).map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Sub Role *</label>
            <select
              className="w-full rounded border p-2"
              value={subRole}
              onChange={(e) => setSubRole(e.target.value)}
              disabled={!mainRole}
            >
              <option value="">Select</option>
              {mainRole && ROLE_MAIN[mainRole].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Annual Revenue (USD)</label>
            <input className="w-full rounded border p-2" value={revenue} onChange={(e) => setRevenue(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium">Employees</label>
            <input className="w-full rounded border p-2" value={employees} onChange={(e) => setEmployees(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Area of Operations</label>
          <textarea
            className="w-full rounded border p-2"
            value={operations}
            onChange={(e) => setOperations(e.target.value)}
            placeholder="e.g., India, Middle East, Southeast Asia"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Years Active</label>
          <input className="w-full rounded border p-2" value={yearsActive} onChange={(e) => setYearsActive(e.target.value)} />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Starting…" : "Start Survey"}
          </button>
          <button type="button" onClick={reset} className="rounded border px-4 py-2 hover:bg-gray-50">
            Reset
          </button>
        </div>
      </form>
    </main>
  );
}
