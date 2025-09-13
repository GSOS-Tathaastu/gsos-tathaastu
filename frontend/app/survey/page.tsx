"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    role: "retailer",
    companySize: "1-10",
    geography: "India",
    revenueBand: "< $1M",
    painArea: "",
    businessDesc: "",
    name: "",
    email: ""
  });

  const goNext = (e: React.FormEvent) => {
    e.preventDefault();
    sessionStorage.setItem("onboarding", JSON.stringify(form));
    router.push("/survey/questions");
  };

  const set = (k: string, v: string) => setForm((s) => ({ ...s, [k]: v }));

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-semibold mb-6">GSOS Readiness Survey</h1>
      <form onSubmit={goNext} className="space-y-4">
        <div>
          <label className="block mb-1">Your Name (optional)</label>
          <input className="border rounded px-3 py-2 w-full"
                 value={form.name} onChange={(e)=>set("name", e.target.value)} />
        </div>
        <div>
          <label className="block mb-1">Work Email (to receive your blueprint)</label>
          <input type="email" required className="border rounded px-3 py-2 w-full"
                 placeholder="you@company.com"
                 value={form.email} onChange={(e)=>set("email", e.target.value)} />
        </div>
        <div>
          <label className="block mb-1">Role</label>
          <select className="border rounded px-3 py-2 w-full" value={form.role}
                  onChange={(e)=>set("role", e.target.value)}>
            <option>retailer</option><option>manufacturer</option>
            <option>logistics</option><option>financier</option><option>government</option>
          </select>
        </div>
        <div>
          <label className="block mb-1">Company Size</label>
          <input className="border rounded px-3 py-2 w-full" value={form.companySize}
                 onChange={(e)=>set("companySize", e.target.value)} />
        </div>
        <div>
          <label className="block mb-1">Geography</label>
          <input className="border rounded px-3 py-2 w-full" value={form.geography}
                 onChange={(e)=>set("geography", e.target.value)} />
        </div>
        <div>
          <label className="block mb-1">Revenue Band</label>
          <input className="border rounded px-3 py-2 w-full" value={form.revenueBand}
                 onChange={(e)=>set("revenueBand", e.target.value)} />
        </div>
        <div>
          <label className="block mb-1">Primary Pain Area</label>
          <input className="border rounded px-3 py-2 w-full" value={form.painArea}
                 onChange={(e)=>set("painArea", e.target.value)} required />
        </div>
        <div>
          <label className="block mb-1">Business Description (optional)</label>
          <textarea className="border rounded px-3 py-2 w-full" rows={3} value={form.businessDesc}
                 onChange={(e)=>set("businessDesc", e.target.value)} />
        </div>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded">Next</button>
      </form>
    </main>
  );
}
