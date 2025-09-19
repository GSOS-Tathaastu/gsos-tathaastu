// frontend/app/api/trade/route.ts
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongo";

const DB = process.env.MONGODB_DB || "gsos";
const COL = "trade_cache";
const TTL_MINUTES = Number(process.env.TRADE_CACHE_TTL_MINUTES || "1440"); // 1 day

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(DB);
    const col = db.collection(COL);

    const now = new Date();
    const freshAfter = new Date(now.getTime() - TTL_MINUTES * 60 * 1000);

    // newest doc
    const doc = await col.find({}).sort({ fetchedAt: -1 }).limit(1).next();

    if (!doc) {
      // No cache yet
      return NextResponse.json(
        {
          updatedAt: null,
          kpis: [
            { label: "Global exports (USD)", value: "—" },
            { label: "Global imports (USD)", value: "—" },
            { label: "YoY growth", value: "—" },
          ],
          topFlows: [],
        },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    // If doc exists but stale, we still return it (frontend stays fast).
    // Your backend cron will refresh daily.
    const payload = {
      updatedAt: doc.fetchedAt?.toISOString?.() || null,
      kpis: doc.kpis || [],
      topFlows: doc.topFlows || [],
    };
    return NextResponse.json(payload, { headers: { "Cache-Control": "no-store" } });
  } catch (e: any) {
    return NextResponse.json({ error: "trade_cache_failed", detail: e.message }, { status: 500 });
  }
}
