// backend/workers/trade-refresh.mjs
import "dotenv/config";
import { MongoClient } from "mongodb";
import fetch from "node-fetch";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "gsos";
const colName = "trade_cache";

if (!uri) {
  throw new Error("MONGODB_URI missing");
}

// Example source: UN Comtrade-like endpoint or your own proxy
// For demo, we'll hit World Bank trade indicators as a placeholder and synthesize KPIs.
async function fetchLiveTrade() {
  // Replace this with your real source(s)
  try {
    // Example: World Bank global exports/imports (mocked here)
    // You can aggregate multiple endpoints.
    const kpis = [
      { label: "Global exports (USD)", value: "$25.6T" },
      { label: "Global imports (USD)", value: "$25.8T" },
      { label: "YoY growth", value: "+2.1%" },
    ];
    const topFlows = [
      { partner: "USA ↔ CHN", valueUSD: 720000000000 },
      { partner: "USA ↔ MEX", valueUSD: 780000000000 },
      { partner: "CHN ↔ EU", valueUSD: 850000000000 },
      { partner: "DEU ↔ FRA", valueUSD: 180000000000 },
      { partner: "JPN ↔ USA", valueUSD: 230000000000 },
      { partner: "IND ↔ USA", valueUSD: 190000000000 },
    ];
    return { kpis, topFlows };
  } catch (e) {
    console.error("[trade-refresh] live fetch failed:", e);
    return { kpis: [], topFlows: [] };
  }
}

async function main() {
  console.log("[trade-refresh] starting…");
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const col = db.collection(colName);

  const { kpis, topFlows } = await fetchLiveTrade();

  const doc = {
    fetchedAt: new Date(),
    kpis,
    topFlows,
  };

  await col.insertOne(doc);
  console.log("[trade-refresh] stored snapshot at", doc.fetchedAt.toISOString());

  await client.close();
  console.log("[trade-refresh] done");
}

main().catch((e) => { console.error("[trade-refresh] error:", e); process.exit(1); });
