"use client";

import { useEffect, useMemo, useState } from "react";
import SurveyResults from "@/components/SurveyResults";

type Simulation = {
  savingsEstimate?: { shortTermPct: number; midTermPct: number; longTermPct: number };
  goals?: { short: string[]; mid: string[]; long: string[] };
  gsosValue?: string[];
  onboardingWillingnessQuestion?: boolean;
  plans?: {
    freemium?: string[];
    subscription?: { tier: string; price: string; features: string[] }[];
  };
};

function safeParseJSON(text: string | null): any {
  if (!text) return null;
  try { return JSON.parse(text); } catch { return null; }
}

export default function ResultsPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const sessionId = useMemo(() => {
    const v = searchParams?.sessionId;
    return Array.isArray(v) ? v[0] : v || "";
  }, [searchParams]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [simulation, setSimulation] = useState<Simulation | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      setSimulation(null);

      if (!sessionId) {
        setError("Missing sessionId");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/survey/simulation?sessionId=${encodeURIComponent(sessionId)}`, {
          cache: "no-store",
        });
        const txt = await res.text();         // ← don’t assume JSON
        const data = safeParseJSON(txt);

        if (!res.ok || !data || data.ok === false) {
          const msg = data?.error || `HTTP ${res.status}`;
          throw new Error(msg);
        }
        if (!cancelled) setSimulation(data.simulation || null);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load results");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [sessionId]);

  if (loading) {
    return <div className="max-w-3xl mx-auto p-6 text-gray-600">Loading results…</div>;
  }
  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-red-600">
        Error: {String(error)}
      </div>
    );
  }
  if (!simulation) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-gray-600">
        No results available yet.
      </div>
    );
  }

  return <SurveyResults simulation={simulation} />;
}
