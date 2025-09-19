"use client";

import { useEffect, useState } from "react";
import SurveyResults from "@/components/SurveyResults";

export default function ResultsPage() {
  const [simulation, setSimulation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const sessionId =
          new URLSearchParams(window.location.search).get("sessionId") ||
          localStorage.getItem("gsos_sessionId");

        if (!sessionId) {
          setLoading(false);
          return;
        }

        const res = await fetch(`/api/survey/answer?sessionId=${sessionId}`, {
          cache: "no-store",
        });
        const data = await res.json();
        setSimulation(data?.simulation || null);
      } catch (err) {
        console.error("Failed to load results:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <p className="text-center p-10">Loading results…</p>;
  if (!simulation) return <p className="text-center p-10">No results available.</p>;

  return <SurveyResults simulation={simulation} />;
}
