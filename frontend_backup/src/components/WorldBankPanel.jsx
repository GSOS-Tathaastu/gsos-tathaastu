import React, { useMemo, useState, useEffect } from "react";

const COUNTRIES = [
  { code: "IND", name: "India" },
  { code: "USA", name: "United States" },
  { code: "CHN", name: "China" },
  { code: "DEU", name: "Germany" },
  { code: "ARE", name: "United Arab Emirates" },
  { code: "GBR", name: "United Kingdom" },
  { code: "SGP", name: "Singapore" },
  { code: "BRA", name: "Brazil" },
];

const INDICATORS = [
  { id: "NE.TRD.GNFS.ZS", label: "Trade (% of GDP)" },
  { id: "BX.GSR.GNFS.CD", label: "Exports of goods & services (current US$)" },
  { id: "BM.GSR.GNFS.CD", label: "Imports of goods & services (current US$)" },
];

export default function WorldBankPanel() {
  const [selected, setSelected] = useState(["IND", "USA"]);
  const [indicator, setIndicator] = useState(INDICATORS[0].id);
  const [data, setData] = useState([]);
  const [year, setYear] = useState("");
  const [loading, setLoading] = useState(false);

  const toggle = (code) => {
    setSelected((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  useEffect(() => {
    if (selected.length === 0) return;
    const run = async () => {
      setLoading(true);
      try {
        const qs = new URLSearchParams({
          countries: selected.join(","),
          indicator,
        });
        const res = await fetch(`/api/worldbank?${qs.toString()}`);
        const json = await res.json();
        setData(json.rows || []);
        setYear(json.latestYear || "");
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [selected, indicator]);

  const countryName = useMemo(
    () => Object.fromEntries(COUNTRIES.map((c) => [c.code, c.name])),
    []
  );

  return (
    <div className="border rounded-xl p-4 space-y-4">
      <div className="flex flex-col md:flex-row gap-3 md:items-center">
        <div className="flex-1">
          <label className="text-sm font-medium">Indicator</label>
          <select
            className="w-full border rounded-md p-2"
            value={indicator}
            onChange={(e) => setIndicator(e.target.value)}
          >
            {INDICATORS.map((i) => (
              <option key={i.id} value={i.id}>{i.label}</option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label className="text-sm font-medium">Countries</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mt-1">
            {COUNTRIES.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => toggle(c.code)}
                className={`text-left border rounded-md px-3 py-2 ${
                  selected.includes(c.code) ? "bg-gray-100" : "bg-white"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 pr-3">Country</th>
              <th className="py-2">Value {year ? `(${year})` : ""}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={2} className="py-4">Loading…</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={2} className="py-4">No data</td></tr>
            ) : (
              data.map((r) => (
                <tr key={r.country} className="border-b">
                  <td className="py-2 pr-3">{countryName[r.country] || r.country}</td>
                  <td className="py-2">{r.valueFormatted}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
