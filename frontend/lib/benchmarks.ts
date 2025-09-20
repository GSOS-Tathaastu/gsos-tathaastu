import fs from "fs";
import path from "path";
import { getDbOrNull } from "@/lib/mongo";

/** Deal record shape */
export type Deal = {
  investor?: string;
  company?: string;
  stage?: string;
  ticket?: number;
  equity?: number | string;
  date?: string;
  notes?: string;
  source?: string;
};

/** ---- Load deals from local JSON (frontend/data/*.json) ---- */
function loadLocalDeals(): Deal[] {
  const folder = path.join(process.cwd(), "data");
  if (!fs.existsSync(folder)) return [];
  const files = fs
    .readdirSync(folder)
    .filter((f) => f.toLowerCase().endsWith(".json"));

  const all: Deal[] = [];
  for (const f of files) {
    try {
      const parsed = JSON.parse(fs.readFileSync(path.join(folder, f), "utf8"));
      if (Array.isArray(parsed)) {
        all.push(...parsed);
      } else if (parsed && typeof parsed === "object") {
        all.push(parsed as Deal);
      }
    } catch {
      // ignore bad files
    }
  }
  return all.map((d) => ({ ...d, source: d.source || "local" }));
}

/** ---- Load deals from MongoDB (collection: deals) ---- */
async function loadDbDeals(): Promise<Deal[]> {
  const db = await getDbOrNull();
  if (!db) return [];
  try {
    const col = db.collection("deals");
    const docs = await col
      .find({}, { projection: { _id: 0 } })
      .limit(500)
      .toArray();
    return docs.map((d) => ({ ...d, source: "db" })) as Deal[];
  } catch {
    return [];
  }
}

/** ---- Fetch deals from external APIs (SerpAPI, GNews) ----
 *  NOTE: Exported so admin/deals/summary can count external without pulling DB/local.
 */
export async function loadExternalDeals(q: string, limit = 20): Promise<Deal[]> {
  const out: Deal[] = [];

  // SerpAPI (Google News)
  if (process.env.SERPAPI_API_KEY) {
    try {
      const url = `https://serpapi.com/search.json?engine=google_news&q=${encodeURIComponent(
        q + " funding round investment"
      )}&api_key=${process.env.SERPAPI_API_KEY}`;
      const res = await fetch(url);
      const j: any = await res.json();
      if (j?.news_results) {
        for (const n of j.news_results.slice(0, limit)) {
          out.push({
            investor: n.source,
            company: n.title,
            notes: n.snippet,
            date: n.date,
            source: "serpapi",
          });
        }
      }
    } catch {}
  }

  // GNews API
  if (process.env.GNEWS_API_KEY) {
    try {
      const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(
        q + " funding round investment"
      )}&token=${process.env.GNEWS_API_KEY}`;
      const res = await fetch(url);
      const j: any = await res.json();
      if (j?.articles) {
        for (const a of j.articles.slice(0, limit)) {
          out.push({
            investor: a.source?.name,
            company: a.title,
            notes: a.description,
            date: a.publishedAt,
            source: "gnews",
          });
        }
      }
    } catch {}
  }

  return out;
}

/** ---- Merge all sources ---- */
export async function loadAllDeals(opts: {
  investorOrg?: string;
  stage?: string;
  ticket?: number;
}): Promise<Deal[]> {
  const local = loadLocalDeals();
  const db = await loadDbDeals();

  let external: Deal[] = [];
  if (process.env.EXTERNAL_DEALS_ENABLED === "1") {
    const q = [opts.investorOrg, opts.stage, opts.ticket]
      .filter(Boolean)
      .join(" ");
    external = await loadExternalDeals(
      q || "pre-seed seed fintech logistics trade investment round",
      Number(process.env.EXTERNAL_DEALS_LIMIT || 20)
    );
  }

  return [...local, ...db, ...external];
}

/** ---- Find similar deals ---- */
export function similarDeals(
  all: Deal[],
  ref: { investor?: string; stage?: string; ticket?: number }
): Deal[] {
  return all
    .map((d) => {
      let score = 0;
      if (ref.investor && d.investor && d.investor.toLowerCase().includes((ref.investor || "").toLowerCase()))
        score += 2;
      if (ref.stage && d.stage && d.stage.toLowerCase().includes((ref.stage || "").toLowerCase()))
        score += 1;
      if (ref.ticket && d.ticket) {
        const ratio = d.ticket / (ref.ticket || 1);
        if (ratio > 0.5 && ratio < 2) score += 1;
      }
      return { score, deal: d };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.deal);
}
