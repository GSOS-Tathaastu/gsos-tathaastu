// Simple keyless World Bank proxy for SSR/CSR.
// Example: /api/worldbank?country=IND
import { NextResponse } from "next/server";

type WBPoint = { date: string; value: number | null };
type WBResp = [ { page: number }, Array<{ value: number | null; date: string }> ];

async function fetchWB(indicator: string, country = "WLD") {
  const url = `https://api.worldbank.org/v2/country/${country}/indicator/${indicator}?format=json&per_page=1&date=2015:2035`;
  const res = await fetch(url, { next: { revalidate: 60 * 60 * 24 } }); // cache 24h
  if (!res.ok) throw new Error(`WB ${indicator} ${res.status}`);
  const data: WBResp = await res.json();
  const series = data?.[1]?.[0] as any;
  const value = series?.value ?? null;
  const date = series?.date ?? "";
  return { indicator, date, value };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const country = (searchParams.get("country") || "WLD").toUpperCase(); // default World
  try {
    // Indicators:
    // NE.EXP.GNFS.ZS = Exports (% of GDP)
    // NE.IMP.GNFS.ZS = Imports (% of GDP)
    // BX.GSR.GNFS.CD = Exports of goods & services (current US$)
    // BM.GSR.GNFS.CD = Imports of goods & services (current US$)
    const [expPct, impPct, expUsd, impUsd] = await Promise.all([
      fetchWB("NE.EXP.GNFS.ZS", country),
      fetchWB("NE.IMP.GNFS.ZS", country),
      fetchWB("BX.GSR.GNFS.CD", country),
      fetchWB("BM.GSR.GNFS.CD", country),
    ]);

    return NextResponse.json({
      ok: true,
      country,
      stats: { expPct, impPct, expUsd, impUsd },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "worldbank_failed" },
      { status: 502 }
    );
  }
}
