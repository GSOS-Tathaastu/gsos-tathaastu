// frontend/app/survey/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DynamicSurvey from "@/components/DynamicSurvey";

type Profile = { company: string; role: string; country: string };

export default function SurveyPage() {
  const router = useRouter();
  const qp = useSearchParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let company = "";
    let role = "";
    let country = "";

    try {
      company = localStorage.getItem("gsos_company") || "";
      role = localStorage.getItem("gsos_role") || "";
      country = localStorage.getItem("gsos_country") || "";
    } catch { /* ignore */ }

    company = company || qp.get("company") || "";
    role = role || qp.get("role") || "";
    country = country || qp.get("country") || "";

    if (!company || !role || !country) {
      router.replace("/start");
      return;
    }

    setProfile({ company, role, country });
    setLoading(false);
  }, [qp, router]);

  if (loading || !profile) return <div className="p-6 text-sm text-gray-500">Loading…</div>;

  return (
    <div className="max-w-5xl mx-auto p-0 md:p-6 space-y-6">
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
