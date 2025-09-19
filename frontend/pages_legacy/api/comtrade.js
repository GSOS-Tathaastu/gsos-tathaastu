export default async function handler(req, res) {
  try {
    const { r = "IND", ps = String(new Date().getUTCFullYear() - 1) } = req.query;

    const base = "https://comtradeapi.un.org/public/v1/preview/flow";
    const common = `freq=A&px=HS&ps=${encodeURIComponent(ps)}&r=${encodeURIComponent(
      r
    )}&p=0&cc=TOTAL`;

    const headers = {};
    if (process.env.COMTRADE_API_KEY) {
      headers["Ocp-Apim-Subscription-Key"] = process.env.COMTRADE_API_KEY;
    }

    const [expRes, impRes] = await Promise.all([
      fetch(`${base}/export?${common}`, { headers, next: { revalidate: 3600 } }),
      fetch(`${base}/import?${common}`, { headers, next: { revalidate: 3600 } }),
    ]);

    if (!expRes.ok || !impRes.ok) {
      return res.status(502).json({ error: "Comtrade fetch failed" });
    }

    const expJson = await expRes.json();
    const impJson = await impRes.json();

    const exportsVal = expJson?.dataset?.[0]?.TradeValue || 0;
    const importsVal = impJson?.dataset?.[0]?.TradeValue || 0;
    const balance = exportsVal - importsVal;

    const fmt = (v) =>
      Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(v);

    return res.status(200).json({
      reporter: r,
      year: Number(ps),
      exports: exportsVal,
      imports: importsVal,
      balance,
      exportsFormatted: fmt(exportsVal),
      importsFormatted: fmt(importsVal),
      balanceFormatted: (balance >= 0 ? "" : "−") + fmt(Math.abs(balance)),
      notes:
        "Annual HS, all commodities, partner=World. Values may be provisional depending on year.",
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "server_error" });
  }
}
