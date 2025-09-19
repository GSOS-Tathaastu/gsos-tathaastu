import React, { useEffect, useState } from "react";

export default function TradeSummary() {
  const [reporter, setReporter] = useState("IND");
  const [year, setYear] = useState(new Date().getUTCFullYear() - 1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ r: reporter, ps: String(year) });
      const res = await fetch(`/api/comtrade?${qs.toString()}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="border rounded-xl p-4 space-y-4">
      <div className="flex flex-col md:flex-row gap-3 md:items-end">
        <div className="flex-1">
          <label className="text-sm font-medium">Reporter (ISO3)</label>
          <input
            value={reporter}
            onChange={(e) => setReporter(e.target.value.toUpperCase().slice(0,3))}
            className="w-full border rounded-md p-2"
            placeholder="IND"
          />
        </div>
        <div className="w-40">
          <label className="text-sm font-medium">Year</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-full border rounded-md p-2"
          />
        </div>
        <div>
          <button onClick={load} className="px-4 py-2 border rounded-md">Refresh</button>
        </div>
      </div>

      {loading ? <div>Loading…</div> : data ? (
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-3">Metric</th>
                <th className="py-2">Value</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 pr-3">Total Exports (US$)</td>
                <td className="py-2">{data.exportsFormatted}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-3">Total Imports (US$)</td>
                <td className="py-2">{data.importsFormatted}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-3">Trade Balance (US$)</td>
                <td className={`py-2 ${data.balance >= 0 ? "text-green-700" : "text-red-700"}`}>
                  {data.balanceFormatted}
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-3">Notes</td>
                <td className="py-2 text-gray-600">{data.notes}</td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : <div className="text-sm text-gray-600">No data</div>}
    </div>
  );
}
