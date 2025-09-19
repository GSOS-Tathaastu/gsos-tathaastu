// frontend/app/worldbank/page.tsx

"use client";
import { useEffect, useState } from "react";

type WBRow = { indicator: string; value: number | null; year: number };

const DEFAULTS = ["IND","USA","CHN"];

export default function WorldBankComparePage() {
  const [countries, setCountries] = useState<string[]>(DEFAULTS);
  const [data, setData] = useState<Record<string, WBRow[]>>({});
  const [loading, setLoading] = useState(false);

  const load = async (codes: string[]) => {
    setLoading(true);
    try {
      const out: Record<string, WBRow[]> = {};
      for (const c of codes) {
        const r = await fetch(`/api/worldbank?country=${encodeURIComponent(c)}`, { cache: "no-store" });
        out[c] = await r.json();
      }
      setData(out);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(countries); }, []);

  const addCountry = (code: string) => {
    const c = code.trim().toUpperCase();
    if (!c || countries.includes(c)) return;
    const next = [...countries, c].slice(0, 6);
    setCountries(next);
    load(next);
  };

  const removeCountry = (code: string) => {
    const next = countries.filter(x => x !== code);
    setCountries(next);
    load(next);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-4">
      <h1 className="text-xl font-semibold">World Bank — Compare Countries</h1>
      <div className="flex gap-2 items-center">
        <input id="ccode" className="border rounded p-2 w-40" placeholder="e.g., JPN"
          onKeyDown={(e:any)=>{ if (e.key==="Enter") { addCountry(e.currentTarget.value); e.currentTarget.value=""; }}} />
        <button className="px-3 py-2 rounded border" onClick={()=> {
          const el = document.getElementById("ccode") as HTMLInputElement | null;
          if (el?.value) { addCountry(el.value); el.value=""; }
        }}>Add</button>
        <span className="text-xs opacity-60">Max 6 countries.</span>
      </div>

      {loading && <div className="opacity-60">Loading…</div>}

      <div className="grid md:grid-cols-3 gap-4">
        {countries.map(c => (
          <div key={c} className="border rounded p-3">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">{c}</h3>
              <button className="text-xs underline" onClick={()=>removeCountry(c)}>remove</button>
            </div>
            <ul className="text-sm space-y-1">
              {(data[c] || []).map(row => (
                <li key={row.indicator} className="flex justify-between">
                  <span className="opacity-70">{row.indicator}</span>
                  <b>{row.value ?? "—"}</b>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
