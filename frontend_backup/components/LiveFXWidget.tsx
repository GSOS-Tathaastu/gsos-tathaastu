"use client";
import { useEffect, useMemo, useState } from "react";

export default function LiveFXWidget({ base = "INR", symbols = ["USD","EUR","AED"] }: { base?: string; symbols?: string[] }) {
  const [data, setData] = useState<any>(null);
  const [amount, setAmount] = useState<number>(1);
  const [target, setTarget] = useState<string>(symbols[0]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const params = new URLSearchParams({ base, symbols: symbols.join(",") });
        const res = await fetch(`/api/fx?${params.toString()}`);
        const json = await res.json();
        if (!mounted) return;
        if (json.error) throw new Error(json.error);
        setData(json);
      } catch (e: any) { setError(e.message); }
    };
    load();
    const id = setInterval(load, 5 * 60 * 1000);
    return () => { mounted = false; clearInterval(id); };
  }, [base, symbols.join(",")]);

  const converted = useMemo(() => {
    if (!data?.rates) return 0;
    const rate = data.rates[target];
    return Number(amount) * (rate || 0);
  }, [data, amount, target]);

  if (error) return <div className="text-red-600">FX error: {error}</div>;
  if (!data) return <div className="opacity-70">Loading FX…</div>;

  return (
    <div className="border rounded-2xl p-4 shadow-sm bg-white/70 dark:bg-zinc-900/60">
      <div className="text-sm mb-2">FX Provider: <span className="font-mono">{data.provider}</span> • Date: {data.date}</div>
      <div className="flex gap-4 items-end flex-wrap">
        <label className="flex flex-col text-sm">
          Amount ({base})
          <input value={amount} onChange={e=>setAmount(Number(e.target.value))} type="number" step="0.01" className="p-2 rounded border"/>
        </label>
        <label className="flex flex-col text-sm">
          Target
          <select value={target} onChange={e=>setTarget(e.target.value)} className="p-2 rounded border">
            {symbols.map(s => <option key={s}>{s}</option>)}
          </select>
        </label>
        <div className="ml-auto text-right">
          <div className="text-xs uppercase opacity-70">Converted</div>
          <div className="text-2xl font-semibold">{converted.toFixed(4)} {target}</div>
        </div>
      </div>
    </div>
  );
}
