export default async function handler(req, res) {
  try {
    const { countries = "IND,USA", indicator = "NE.TRD.GNFS.ZS" } = req.query;
    const url = `https://api.worldbank.org/v2/country/${encodeURIComponent(
      countries
    )}/indicator/${encodeURIComponent(indicator)}?format=json&per_page=2000`;

    const wbRes = await fetch(url, { next: { revalidate: 3600 } });
    if (!wbRes.ok) {
      return res.status(wbRes.status).json({ error: "World Bank fetch failed" });
    }
    const [meta, rows] = await wbRes.json();

    const latestByCountry = {};
    for (const row of rows || []) {
      const c = row.country?.id;
      const val = row.value;
      const date = row.date;
      if (!c) continue;
      if (val === null) continue;
      if (!latestByCountry[c] || Number(date) > Number(latestByCountry[c].year)) {
        latestByCountry[c] = { year: date, value: val };
      }
    }
    const latestYear =
      Object.values(latestByCountry).reduce(
        (acc, r) => (Number(r.year) > Number(acc) ? r.year : acc),
        ""
      ) || "";

    const formatter =
      indicator === "NE.TRD.GNFS.ZS"
        ? (v) => `${v.toFixed(1)} %`
        : (v) =>
            Intl.NumberFormat("en-US", {
              notation: "compact",
              maximumFractionDigits: 1,
            }).format(v);

    const out = Object.entries(latestByCountry).map(([country, { year, value }]) => ({
      country,
      year,
      value,
      valueFormatted: typeof value === "number" ? formatter(value) : value,
    }));

    return res
      .status(200)
      .json({ latestYear, rows: out.sort((a, b) => a.country.localeCompare(b.country)) });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "server_error" });
  }
}
