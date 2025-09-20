"use client";

import { useEffect, useState } from "react";
import SurveyRunner from "@/components/SurveyRunner";

type Step0Form = {
  roleMain: string;
  roleSub: string;
  company: string;
  country: string;
  email: string;
  revenue: string;
  employees: string;
  operations: string;
  yearsActive: string;
};

const ROLE_MAIN: Record<string, string[]> = {
  SME: ["Manufacturer", "Trader", "Exporter", "Importer"],
  Corporate: ["MNC", "Large Enterprise", "Conglomerate"],
  Logistics: ["Freight Forwarder", "3PL", "Customs Broker"],
  Finance: ["Bank", "NBFC", "Fintech"],
  Insurer: ["Trade Credit", "Marine Cargo", "General"],
  Regulator: ["Customs", "DGFT", "Central Bank"],
  Broker: ["Agent", "Middleman", "Distributor"],
  Retailer: ["Wholesale", "Retail Chain", "E-Commerce"],
};

export default function SurveyPage() {
  const [step, setStep] = useState<0 | 1>(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // form state (Step 0)
  const [form, setForm] = useState<Step0Form>({
    roleMain: "",
    roleSub: "",
    company: "",
    country: "",
    email: "",
    revenue: "",
    employees: "",
    operations: "",
    yearsActive: "",
  });

  // hydrate from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("gsos_form");
    if (saved) setForm(JSON.parse(saved));
  }, []);

  function handleChange(field: keyof Step0Form, value: string) {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      localStorage.setItem("gsos_form", JSON.stringify(updated));
      return updated;
    });
  }

  async function handleStartSurvey(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/survey/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Failed to generate survey");

      setSessionId(data.sessionId);
      setQuestions(data.questions || []);
      localStorage.setItem("gsos_session", data.sessionId);
      setStep(1);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (step === 0) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-4">Step-0: Tell us about your business</h1>
        <form onSubmit={handleStartSurvey} className="space-y-4">

          <div>
            <label className="block text-sm font-medium">Main Role *</label>
            <select
              name="roleMain"
              value={form.roleMain}
              onChange={(e) => handleChange("roleMain", e.target.value)}
              required
              className="w-full border rounded p-2"
            >
              <option value="">Select</option>
              {Object.keys(ROLE_MAIN).map((main) => (
                <option key={main} value={main}>
                  {main}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Sub Role *</label>
            <select
              name="roleSub"
              value={form.roleSub}
              onChange={(e) => handleChange("roleSub", e.target.value)}
              required
              className="w-full border rounded p-2"
              disabled={!form.roleMain}
            >
              <option value="">Select</option>
              {form.roleMain &&
                ROLE_MAIN[form.roleMain].map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Company</label>
            <input
              name="company"
              value={form.company}
              onChange={(e) => handleChange("company", e.target.value)}
              className="w-full border rounded p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Country *</label>
            <input
              name="country"
              value={form.country}
              onChange={(e) => handleChange("country", e.target.value)}
              required
              className="w-full border rounded p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Email *</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              required
              className="w-full border rounded p-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Revenue</label>
              <input
                name="revenue"
                value={form.revenue}
                onChange={(e) => handleChange("revenue", e.target.value)}
                className="w-full border rounded p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Employees</label>
              <input
                name="employees"
                value={form.employees}
                onChange={(e) => handleChange("employees", e.target.value)}
                className="w-full border rounded p-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Operations Area</label>
            <input
              name="operations"
              value={form.operations}
              onChange={(e) => handleChange("operations", e.target.value)}
              className="w-full border rounded p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Years Active</label>
            <input
              name="yearsActive"
              value={form.yearsActive}
              onChange={(e) => handleChange("yearsActive", e.target.value)}
              className="w-full border rounded p-2"
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="rounded bg-indigo-600 text-white px-4 py-2"
          >
            {loading ? "Generating..." : "Start Survey"}
          </button>
        </form>
      </div>
    );
  }

  // Step 1 → show AI-generated survey
  return <SurveyRunner sessionId={sessionId!} initialQuestions={questions} />;
}
