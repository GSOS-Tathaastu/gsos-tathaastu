// Live FX (Edge) — defaults INR → USD,EUR,AED
export const runtime = "edge";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const base = (searchParams.get("base") || "INR").toUpperCase();
    const symbols = (searchParams.get("symbols") || "USD,EUR,AED")
      .split(",").map(s => s.trim().toUpperCase());

    const fetchFrankfurter = async () => {
      const url = `https://api.frankfurter.app/latest?from=${base}&to=${symbols.join(",")}`;
      const res = await fetch(url, { next: { revalidate: 300 } });
      if (!res.ok) throw new Error("Frankfurter failed");
      const data = await res.json();
      return { provider: "frankfurter", base: data.base, date: data.date, rates: data.rates };
    };
    const fetchERH = async () => {
      const url = `https://api.exchangerate.host/latest?base=${base}&symbols=${symbols.join(",")}`;
      const res = await fetch(url, { next: { revalidate: 300 } });
      if (!res.ok) throw new Error("exchangerate.host failed");
      const data = await res.json();
      return { provider: "exchangerate_host", base: data.base, date: data.date, rates: data.rates };
    };

    let payload;
    try { payload = await fetchFrankfurter(); }
    catch { payload = await fetchERH(); }

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "Cache-Control": "s-maxage=300, stale-while-revalidate=3600",
      },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
