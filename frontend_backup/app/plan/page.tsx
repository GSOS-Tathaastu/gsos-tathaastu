// frontend/app/plan/page.tsx
"use client";
import { useEffect, useState } from "react";

export default function PlanPage() {
  const [plan, setPlan] = useState<any>(null);

  useEffect(() => {
    const p = sessionStorage.getItem("plan");
    if (p) setPlan(JSON.parse(p));
  }, []);

  if (!plan) return <div className="max-w-3xl mx-auto p-4">No plan found. Please complete the survey first.</div>;

  const Section = ({ title, items }:{title:string; items:string[]}) => (
    <div className="border rounded-2xl p-4">
      <h3 className="font-semibold mb-2">{title}</h3>
      <ul className="list-disc ml-5 space-y-1">
        {items?.map((t:string, i:number)=>(<li key={i}>{t}</li>))}
      </ul>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">Your Tailored Plan</h1>

      {plan.overview && (
        <div className="border rounded-2xl p-4">
          <div className="font-semibold mb-2">Overview</div>
          <p className="opacity-80">{plan.overview}</p>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        <Section title="Next 30 days" items={plan.next30 || []} />
        <Section title="Next 60 days" items={plan.next60 || []} />
        <Section title="Next 90 days" items={plan.next90 || []} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Section title="KPIs" items={plan.kpis || []} />
        <Section title="Integrations" items={plan.integrations || []} />
      </div>

      {plan.risks && <Section title="Risks / Watchouts" items={plan.risks || []} />}

      <div className="border rounded-2xl p-4 flex items-center justify-between">
        <div>
          <div className="font-semibold">Ready to execute?</div>
          <div className="text-sm opacity-70">{plan.callToAction || "Let’s review your plan and start implementation."}</div>
        </div>
        <a href="/book" className="px-4 py-2 rounded-xl bg-black text-white">Book a Call</a>
      </div>
    </div>
  );
}
