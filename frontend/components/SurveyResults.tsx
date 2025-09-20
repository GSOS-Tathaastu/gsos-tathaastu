// frontend/components/SurveyResults.tsx

"use client";

import { Simulation } from "@/lib/types";

type Props = {
  simulation?: Simulation;
};

export default function SurveyResults({ simulation }: Props) {
  if (!simulation) {
    return <div className="p-4 text-gray-600">No results available.</div>;
  }

  return (
    <div className="p-6 bg-white shadow rounded-lg">
      <h2 className="text-xl font-semibold mb-4">Simulation Results</h2>
      {simulation.savingsEstimate ? (
        <ul className="space-y-2">
          <li>
            <strong>Short Term:</strong>{" "}
            {simulation.savingsEstimate.shortTermPct ?? "-"}%
          </li>
          <li>
            <strong>Mid Term:</strong>{" "}
            {simulation.savingsEstimate.midTermPct ?? "-"}%
          </li>
          <li>
            <strong>Long Term:</strong>{" "}
            {simulation.savingsEstimate.longTermPct ?? "-"}%
          </li>
        </ul>
      ) : (
        <div>No savings estimate data.</div>
      )}
    </div>
  );
}
