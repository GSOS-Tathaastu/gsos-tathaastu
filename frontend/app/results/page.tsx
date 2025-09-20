// frontend/app/results/page.tsx

import { Simulation } from "@/lib/types";
import SurveyResults from "@/components/SurveyResults";

export default async function ResultsPage() {
  // For now, use dummy simulation data.
  // In production, fetch from DB or API.
  const simulation: Simulation = {
    savingsEstimate: {
      shortTermPct: 5,
      midTermPct: 12,
      longTermPct: 20,
    },
  };

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Survey Results</h1>
      <SurveyResults simulation={simulation} />
    </main>
  );
}
