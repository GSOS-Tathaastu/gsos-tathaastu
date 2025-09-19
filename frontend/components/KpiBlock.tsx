// frontend/components/KpiBlock.tsx
"use client";
import { useEffect, useState } from "react";

type KPI = { label: string; value: string | number };

export default function KpiBlock() {
  const [kpis, setKpis] = useState<KPI[]>([]);

  useEffect(() => {
    fetch("/api/trade", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setKpis(d.kpis || []))
      .catch(() => {});
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      {kpis.map((k) => (
        <div key={k.label} className="rounded-xl bg-white dark:bg-gray-800 shadow p-4 text-center">
          <p className="text-sm text-gray-500">{k.label}</p>
          <p className="text-2xl font-semibold">{k.value}</p>
        </div>
      ))}
    </div>
  );
}
