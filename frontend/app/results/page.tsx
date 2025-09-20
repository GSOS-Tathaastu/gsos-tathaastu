"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import SurveyResults from "@/components/SurveyResults";

export default function ResultsPage() {
  const sp = useSearchParams();
  const sessionId =
    sp.get("sessionId") || (typeof window !== "undefined" ? localStorage.getItem("gsos_session") || "" : "");

  const [loading, setLoading] = useState(true);
  const [simulation, setSimulation] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const r = await fetch(`/api/survey/answer?sessionId=${encodeURIComponent(sessionId)}`, {
          cache: "no-store",
        });
        const j = await r.json();
        if (!r.ok || !j?.ok) throw new Error(j?.error || `Fetch failed (${r.status})`);
        setSimulation(j.simulation || j.data || null);
      } catch (e: any) {
        setErr(e?.message || "Unable to load results.");
      } finally {
        setLoading(false);
      }
    })();
  }, [sessionId]);

  if (!sessionId) {
    return (
      <main className="max-w-2xl mx-auto p-6">
        <h1 className="text-xl font-semibold mb-2">Missing session</h1>
        <p className="text-gray-600">
          Please start from <a className="text-indigo-600 underline" href="/start">Step-0</a>.
        </p>
      </main>
    );
  }

  if (loading) return <main className="max-w-3xl mx-auto p-6">Loading…</main>;
  if (err) return <main className="max-w-3xl mx-auto p-6 text-red-600">Error: {err}</main>;

  return <SurveyResults simulation={simulation} />;
}
