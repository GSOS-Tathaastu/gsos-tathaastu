"use client";

type Simulation = {
  savingsEstimate: { shortTermPct: number; midTermPct: number; longTermPct: number };
  goals: { short: string[]; mid: string[]; long: string[] };
  gsosValue: string[];
  onboardingWillingnessQuestion: boolean;
  plans: {
    freemium: string[];
    subscription: { tier: string; price: string; features: string[] }[];
  };
};

export default function SurveyResults({ simulation }: { simulation: Simulation }) {
  if (!simulation) {
    return <p className="text-gray-500">No simulation data available.</p>;
  }

  return (
    <section className="max-w-5xl mx-auto py-10 px-6">
      <h2 className="text-3xl font-bold mb-6">📊 Your GSOS Simulation</h2>

      {/* Savings */}
      <div className="bg-blue-50 dark:bg-blue-900 p-6 rounded-2xl mb-8 shadow">
        <h3 className="font-semibold mb-4">Estimated Savings</h3>
        <ul className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <li className="text-center">
            <p className="text-lg font-bold">{simulation.savingsEstimate.shortTermPct}%</p>
            <p className="text-sm text-gray-600">Short-term</p>
          </li>
          <li className="text-center">
            <p className="text-lg font-bold">{simulation.savingsEstimate.midTermPct}%</p>
            <p className="text-sm text-gray-600">Mid-term</p>
          </li>
          <li className="text-center">
            <p className="text-lg font-bold">{simulation.savingsEstimate.longTermPct}%</p>
            <p className="text-sm text-gray-600">Long-term</p>
          </li>
        </ul>
      </div>

      {/* Goals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow">
          <h4 className="font-semibold mb-2">Short-term Goals</h4>
          <ul className="list-disc ml-4 text-sm">
            {(simulation.goals.short || []).map((g) => <li key={g}>{g}</li>)}
          </ul>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow">
          <h4 className="font-semibold mb-2">Mid-term Goals</h4>
          <ul className="list-disc ml-4 text-sm">
            {(simulation.goals.mid || []).map((g) => <li key={g}>{g}</li>)}
          </ul>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow">
          <h4 className="font-semibold mb-2">Long-term Goals</h4>
          <ul className="list-disc ml-4 text-sm">
            {(simulation.goals.long || []).map((g) => <li key={g}>{g}</li>)}
          </ul>
        </div>
      </div>

      {/* GSOS Value */}
      <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-2xl mb-8 shadow">
        <h4 className="font-semibold mb-2">How GSOS Helps</h4>
        <ul className="list-disc ml-4 text-sm">
          {(simulation.gsosValue || []).map((v) => <li key={v}>{v}</li>)}
        </ul>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-green-50 dark:bg-green-900 p-6 rounded-2xl shadow">
          <h4 className="font-semibold mb-2">Freemium Plan</h4>
          <ul className="list-disc ml-4 text-sm">
            {(simulation.plans.freemium || []).map((f) => <li key={f}>{f}</li>)}
          </ul>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900 p-6 rounded-2xl shadow">
          <h4 className="font-semibold mb-2">Subscription Plans</h4>
          {(simulation.plans.subscription || []).map((s) => (
            <div key={s.tier} className="mb-4">
              <p className="font-bold">{s.tier} – {s.price}</p>
              <ul className="list-disc ml-4 text-sm">
                {s.features.map((f) => <li key={f}>{f}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
