// frontend/app/api/trade-issues/route.ts
import { NextResponse } from "next/server";

type WbPoint = {
  date: string; // year
  value: number | null;
};

async function fetchWB(indicator: string): Promise<WbPoint[]> {
  const url = `https://api.worldbank.org/v2/country/WLD/indicator/${indicator}?format=json&per_page=8`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`WB ${indicator} failed: ${res.status}`);
  const data = await res.json();
  const arr = (data?.[1] ?? []) as any[];
  return arr
    .map((d) => ({ date: d.date as string, value: d.value as number | null }))
    .filter((d) => d.value !== null);
}

function pctChange(latest: number, prev: number) {
  if (prev === 0) return 0;
  return ((latest - prev) / Math.abs(prev)) * 100;
}

export async function GET() {
  try {
    // Indicators:
    // NE.EX.GNFS.KD.ZG = Exports of goods & services (annual % growth)
    // NE.IMP.GNFS.KD.ZG = Imports of goods & services (annual % growth)
    // IS.SHP.GOOD.TU   = Container port traffic (TEU: 20-foot)
    const [exp, imp, teu] = await Promise.all([
      fetchWB("NE.EX.GNFS.KD.ZG"),
      fetchWB("NE.IMP.GNFS.KD.ZG"),
      fetchWB("IS.SHP.GOOD.TU"),
    ]);

    const items: string[] = [];

    // Exports growth
    if (exp.length >= 2) {
      const [latest, prev] = [exp[0], exp[1]];
      const g = latest.value as number;
      if (g < 0) {
        items.push(
          `Global export growth contracted ${g.toFixed(1)}% in ${latest.date} → demand softness & revenue risk.`,
        );
      } else {
        items.push(
          `Global export growth was ${g.toFixed(1)}% in ${latest.date} → volatility remains for cross-border sales.`,
        );
      }
    }

    // Imports growth
    if (imp.length >= 2) {
      const [latest] = [imp[0]];
      const g = latest.value as number;
      if (g < 0) {
        items.push(
          `Global import growth fell ${g.toFixed(1)}% in ${latest.date} → procurement & replenishment headwinds.`,
        );
      } else {
        items.push(
          `Global import growth was ${g.toFixed(1)}% in ${latest.date} → mixed signal for replenishment cycles.`,
        );
      }
    }

    // Container port traffic (TEU)
    if (teu.length >= 2) {
      const [latest, prev] = [teu[0], teu[1]];
      const change = pctChange(latest.value as number, prev.value as number);
      if (isFinite(change)) {
        if (change < 0) {
          items.push(
            `Container port throughput down ${change.toFixed(1)}% in ${latest.date} → congestion & longer lead times.`,
          );
        } else {
          items.push(
            `Container port throughput up ${change.toFixed(1)}% in ${latest.date} → capacity tightness possible.`,
          );
        }
      }
    }

    // Sensible fallbacks if API returns sparse data
    if (items.length === 0) {
      items.push(
        "Currency volatility impacting landed costs.",
        "Carrier schedule reliability remains uneven.",
        "Documentation & compliance delays at borders."
      );
    }

    return NextResponse.json({ items }, { status: 200 });
  } catch (err) {
    // On any error, still return safe defaults so the UI never breaks
    return NextResponse.json(
      {
        items: [
          "Global container imbalances affecting freight availability.",
          "Tariff & duty changes raise unpredictability.",
          "Supplier lead-time variability remains elevated.",
        ],
        error: "fallback",
      },
      { status: 200 },
    );
  }
}
