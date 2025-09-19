// frontend/app/start/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function StartPage() {
  const router = useRouter();
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("retailer");
  const [country, setCountry] = useState("India");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  async function onContinue() {
    setToast(null);

    if (!company.trim()) {
      setToast("Please enter your company name.");
      return;
    }
    if (!role) {
      setToast("Please select a role.");
      return;
    }
    if (!country) {
      setToast("Please select a country.");
      return;
    }

    // Persist to localStorage for Survey to read
    try {
      localStorage.setItem("gsos_company", company.trim());
      localStorage.setItem("gsos_role", role);
      localStorage.setItem("gsos_country", country);
      if (email.trim()) localStorage.setItem("gsos_email", email.trim());
    } catch {
      // ignore
    }

    // OPTIONAL: also save to DB (non-blocking, best effort)
    try {
      setSaving(true);
      await fetch("/api/company/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          companyName: company.trim(),
          contactName: "", // you can add fields on this page if you wish
          email: email.trim() || undefined,
          roleMain: role,
          roleSub: "",
          aboutCompany: "",
          products: "",
        }),
      }).catch(() => {});
    } finally {
      setSaving(false);
    }

    router.push("/survey");
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="bg-gray-900 text-white rounded-2xl px-6 py-4">
        <div className="text-lg font-semibold">Step-0: Tell us about you</div>
        <div className="text-sm opacity-80">We’ll tailor the survey to your profile.</div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block font-medium mb-1">Company Name <span className="text-red-500">*</span></label>
          <input
            className="w-full px-4 py-2 rounded-xl border border-gray-300"
            placeholder="e.g., GLOBAL NEXUS EXIM (OPC) PRIVATE LIMITED"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Role <span className="text-red-500">*</span></label>
          <select
            className="w-full px-4 py-2 rounded-xl border border-gray-300"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="retailer">Retailer</option>
            <option value="seller">Seller</option>
            <option value="buyer">Buyer</option>
            <option value="logistics">Logistics/3PL</option>
            <option value="bank">Bank/Financier</option>
            <option value="insurer">Insurer</option>
            <option value="broker">Broker/Agent</option>
            <option value="govt">Govt/Regulator</option>
          </select>
        </div>

        <div>
          <label className="block font-medium mb-1">Country <span className="text-red-500">*</span></label>
          <input
            className="w-full px-4 py-2 rounded-xl border border-gray-300"
            placeholder="e.g., India"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Email (optional)</label>
          <input
            type="email"
            className="w-full px-4 py-2 rounded-xl border border-gray-300"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">We’ll use this to send your survey results or contact you.</p>
        </div>

        <button
          onClick={onContinue}
          disabled={saving}
          className="px-5 py-2 rounded-xl bg-black text-white disabled:opacity-50"
        >
          {saving ? "Saving…" : "Continue to Survey"}
        </button>

        {toast && <div className="text-sm text-red-600">{toast}</div>}
      </div>
    </div>
  );
}
