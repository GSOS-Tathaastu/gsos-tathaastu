// frontend/app/survey/page.tsx
"use client";

import { useEffect, useState } from "react";
import DynamicSurvey from "@/components/DynamicSurvey";

type Profile = {
  company: string;
  role: string;
  country: string;
};

export default function SurveyPage() {
  const [profile, setProfile] = useState<Profile | null>(null);

  // Example: read Step-0 info from localStorage written by your Step-0 form.
  // If you store it differently, adjust keys below.
  useEffect(() => {
    try {
      const company = localStorage.getItem("gsos_company") || "GLOBAL NEXUS EXIM (OPC) PRIVATE LIMITED";
      const role = localStorage.getItem("gsos_role") || "retailer";
      const country = localStorage.getItem("gsos_country") || "India";
      setProfile({ company, role, country });
    } catch {
      setProfile({ company: "Company", role: "retailer", country: "India" });
    }
  }, []);

  if (!profile) return <div className="p-6 text-sm text-gray-500">Loading…</div>;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="bg-gray-900 text-white rounded-2xl px-6 py-4">
        <div className="text-sm opacity-80">Your profile (from Step-0)</div>
        <div className="text-lg font-semibold">
          {profile.company} • {profile.role} • {profile.country}
        </div>
      </div>

      <DynamicSurvey role={profile.role} country={profile.country} company={profile.company} />
    </div>
  );
}
