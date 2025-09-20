// frontend/app/api/worldbank/route.ts
// Simple keyless World Bank proxy for SSR/CSR.
// Example: /api/worldbank?country=IND

import { NextResponse } from "next/server";

type WBPoint = { date: string; value: number | null };
type WBResp = [unknown, Array<WBPoint> | undefined];

/**
 * Fetches latest World Bank indicator data for a country.
 */
async function fetchWB(indicator: string, country = "WLD") {
  const url = `https://api.worldbank.org/v2/country/${country}/indicator/${indicator}?format=json&per_page=1&date=2015:2035`;

  const res = await fetch(url, {
    // Revalidate once per day on the server
    next: { revalidate: 60 * 60 * 24 },
  });

  if (!res.ok) throw new Error(`WB ${indicator} ${res.status}`);

  const data: WBResp = await res.json();
  const series = data?.[1]?.[0];

  return {
    indicator,
    date: series?.date ?? "",
    value: series?.value ?? null,
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const country = (searchParams.get("country") || "WLD").toUpperCase();

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
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "worldbank_failed" },
      { status: 502 }
    );
  }
}
