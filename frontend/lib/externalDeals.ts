// frontend/lib/externalDeals.ts
export type ExtArticle = { title: string; url: string; publishedAt?: string; source?: string; snippet?: string; };
export type Deal = { investor?: string; company?: string; stage?: string; ticket?: number; equity?: number; date?: string; notes?: string; source?: string; link?: string; };

const SERP_KEY = process.env.SERPAPI_API_KEY || "";
const GNEWS_KEY = process.env.GNEWS_API_KEY || "";
const MAX_ITEMS = Number(process.env.EXTERNAL_DEALS_LIMIT || "20");

function usdFromText(s: string): number | undefined {
  const m = s.toLowerCase().match(/(?:usd|\$)\s*([\d,.]+)\s*([mk])?/i);
  if (!m) return;
  const n = Number(m[1].replace(/,/g, ""));
  if (!isFinite(n)) return;
  const unit = m[2];
  if (unit === "m") return n * 1_000_000;
  if (unit === "k") return n * 1_000;
  return n;
}
function pctFromText(s: string): number | undefined {
  const m = s.toLowerCase().match(/(\d+(?:\.\d+)?)\s*%/);
  if (!m) return;
  const p = Number(m[1]);
  if (!isFinite(p)) return;
  return p / 100;
}

async function fetchSerpNews(q: string): Promise<ExtArticle[]> {
  if (!SERP_KEY) return [];
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google_news");
  url.searchParams.set("q", q);
  url.searchParams.set("api_key", SERP_KEY);
  url.searchParams.set("num", String(Math.min(20, MAX_ITEMS)));
  try {
    const r = await fetch(url.toString());
    if (!r.ok) return [];
    const j = await r.json();
    const arr = Array.isArray(j?.news_results) ? j.news_results : [];
    return arr.map((it: any) => ({
      title: it.title,
      url: it.link,
      publishedAt: it?.date,
      source: "serpapi",
      snippet: it?.snippet || it?.summary || "",
    }));
  } catch { return []; }
}
async function fetchGNews(q: string): Promise<ExtArticle[]> {
  if (!GNEWS_KEY) return [];
  const url = new URL("https://gnews.io/api/v4/search");
  url.searchParams.set("q", q);
  url.searchParams.set("lang", "en");
  url.searchParams.set("max", String(Math.min(20, MAX_ITEMS)));
  url.searchParams.set("token", GNEWS_KEY);
  try {
    const r = await fetch(url.toString());
    if (!r.ok) return [];
    const j = await r.json();
    const arr = Array.isArray(j?.articles) ? j.articles : [];
    return arr.map((it: any) => ({
      title: it.title,
      url: it.url,
      publishedAt: it.publishedAt,
      source: "gnews",
      snippet: it.description || "",
    }));
  } catch { return []; }
}
function articleToDeal(a: ExtArticle): Deal {
  const base = `${a.title} ${a.snippet || ""}`;
  return {
    stage: /pre[-\s]?seed|seed|series\s*a\b/i.test(base) ? (base.match(/pre[-\s]?seed|seed|series\s*a\b/i)?.[0] || "") : undefined,
    ticket: usdFromText(base),
    equity: pctFromText(base),
    date: a.publishedAt,
    notes: a.title,
    source: a.source,
    link: a.url
  };
}

/** External comparable deals (best-effort). */
export async function fetchExternalDeals(query: { investorOrg?: string; stage?: string; ticket?: number }): Promise<Deal[]> {
  const investorOrg = (query.investorOrg || "").trim();
  const stage = (query.stage || "").trim();
  const qSpecific = investorOrg
    ? `${investorOrg} investment ${stage || "seed pre-seed"} raised`
    : `global trade logistics supply chain ${stage || "seed"} raised`;

  const [serp, gnews] = await Promise.all([fetchSerpNews(qSpecific), fetchGNews(qSpecific)]);
  const arts = [...serp, ...gnews].slice(0, MAX_ITEMS);
  return arts.map(articleToDeal).filter(d => d.ticket || d.stage || d.equity);
}
