"use client";

import Link from "next/link";

export default function AdminNav({ active }: { active: "health" | "metrics" }) {
  const base =
    "px-3 py-1.5 rounded-lg text-sm font-medium transition border";
  const on  = "bg-indigo-600 text-white border-indigo-600";
  const off = "bg-white text-gray-700 hover:bg-gray-100 border-gray-200";

  return (
    <div className="mb-5 flex gap-2">
      <Link
        href="/admin/health"
        className={`${base} ${active === "health" ? on : off}`}
      >
        Health
      </Link>
      <Link
        href="/admin/metrics"
        className={`${base} ${active === "metrics" ? on : off}`}
      >
        Metrics
      </Link>
    </div>
  );
}
