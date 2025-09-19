"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

export type Flow = { from: string; to: string; value: number };
export type KPI = { label: string; value: string | number };

export default function TradeKpiSection() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [flows, setFlows] = useState<Flow[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/trade", { cache: "no-store" });
        if (!res.ok) throw new Error(`API ${res.status}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        setKpis(data.kpis || []);
        setFlows(data.topFlows || []);
        setUpdatedAt(data.updatedAt || null);
      } catch (e: any) {
        console.error("Trade API failed", e);
        setError(e.message || "Failed to load trade data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <section className="bg-white dark:bg-gray-800 py-10 rounded-2xl shadow">
      <div className="max-w-5xl mx-auto px-4">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
          🌍 World Trade Snapshot
        </h2>

        {loading && <p className="text-gray-500">Loading trade data…</p>}
        {error && (
          <p className="text-red-600 dark:text-red-400">
            Error: {error}. Check if backend cron populated <code>trade_cache</code>.
          </p>
        )}

        {!loading && !error && (
          <>
            {/* KPI row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              {kpis.map((kpi) => (
                <div
                  key={kpi.label}
                  className="rounded-xl bg-gray-50 dark:bg-gray-700 shadow p-6 text-center"
                >
                  <p className="text-gray-500 dark:text-gray-300 text-sm">
                    {kpi.label}
                  </p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white">
                    {kpi.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Flows chart */}
            {flows.length > 0 && (
              <div className="h-72 rounded-2xl bg-gray-50 dark:bg-gray-700 shadow p-4">
                <h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">
                  Top Trade Flows
                </h3>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={flows.map((f) => ({
                      ...f,
                      label: `${f.from}→${f.to}`,
                    }))}
                  >
                    <XAxis dataKey="label" hide />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) =>
                        Number(value).toLocaleString()
                      }
                      labelFormatter={(label: string) => label}
                    />
                    <Bar
                      dataKey="value"
                      fill="#2563eb"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Timestamp */}
            {updatedAt && (
              <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                Last updated: {new Date(updatedAt).toLocaleString()}
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
