"use client";

import { useEffect, useState } from "react";

type Summary = {
  ok: boolean;
  totals: { sessions: number; countries: number; avgLikert?: number | null };
  byCountry: Array<{ country: string; count: number }>;
  topQuestions: Array<{ id: string; prompt: string; responses: number }>;
  recent: Array<{ email?: string; country?: string; startedAt?: string }>;
  fallback?: boolean;
  error?: string;
};

export default function SurveyAnalytics() {
  const [data, setData] = useState<Summary | null>(null);

  useEffect(() => {
    fetch("/api/survey/summary")
      .then((r) => r.json())
      .then((j) => setData(j))
      .catch(() => setData(null));
  }, []);

  if (!data) {
    return <div className="text-gray-500 text-sm">Loading analytics…</div>;
  }

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="rounded-xl border p-4">
          <div className="text-sm text-gray-500">Total Sessions</div>
          <div className="text-2xl font-bold">{data.totals.sessions}</div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-sm text-gray-500">Countries</div>
          <div className="text-2xl font-bold">{data.totals.countries}</div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-sm text-gray-500">Avg. Likert</div>
          <div className="text-2xl font-bold">
            {data.totals.avgLikert != null ? data.totals.avgLikert.toFixed(2) : "—"}
          </div>
        </div>
      </div>

      {/* Country histogram */}
      {!!data.byCountry?.length && (
        <div className="rounded-xl border p-4">
          <div className="font-semibold mb-3">Responses by Country</div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.byCountry.map((c) => (
              <div
                key={c.country || "unknown"}
                className="flex items-center justify-between rounded-lg border px-3 py-2"
              >
                <div className="text-sm">{c.country || "Unknown"}</div>
                <div className="text-sm font-semibold">{c.count}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top questions */}
      {!!data.topQuestions?.length && (
        <div className="rounded-xl border p-4">
          <div className="font-semibold mb-3">Top Answered Questions</div>
          <div className="space-y-2">
            {data.topQuestions.map((q) => (
              <div key={q.id} className="rounded-lg border p-3">
                <div className="text-sm font-medium">{q.prompt}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Responses: {q.responses}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent */}
      {!!data.recent?.length && (
        <div className="rounded-xl border p-4">
          <div className="font-semibold mb-3">Recent Sessions</div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.recent.map((r, i) => (
              <div key={i} className="rounded-lg border p-3 text-sm">
                <div className="font-medium">{r.email || "Anonymous"}</div>
                <div className="text-gray-600">
                  {r.country || "—"} •{" "}
                  {r.startedAt
                    ? new Date(r.startedAt).toLocaleString()
                    : "unknown"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.fallback ? (
        <div className="text-xs text-orange-600">
          Showing demo data — connect MongoDB to see live analytics.
        </div>
      ) : null}
    </div>
  );
}
