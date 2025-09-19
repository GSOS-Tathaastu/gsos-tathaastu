// frontend/app/api/trade/route.ts
import { NextResponse } from "next/server";
import { getDbOrNull } from "@/lib/mongo";

const DB = process.env.MONGODB_DB || "gsos";
const COL = "trade_cache";
const TTL_MINUTES = Number(process.env.TRADE_CACHE_TTL_MINUTES || "1440"); // 1 day

export async function GET() {
  try {
    const db = await getDbOrNull();
    if (!db) {
      return NextResponse.json(
        {
          updatedAt: null,
          kpis: [
            { label: "Global exports (USD)", value: "—" },
            { label: "Global imports (USD)", value: "—" },
            { label: "YoY growth", value: "—" },
          ],
          topFlows: [],
          error: "Database not connected",
        },
        { headers: { "Cache-Control": "no-store" }, status: 200 }
      );
    }

    const col = db.collection(COL);
    const doc = await col.find({}).sort({ fetchedAt: -1 }).limit(1).next();

    if (!doc) {
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

    return NextResponse.json(
      {
        updatedAt: doc.fetchedAt?.toISOString?.() || null,
        kpis: doc.kpis || [],
        topFlows: doc.topFlows || [],
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: "trade_cache_failed", detail: e.message },
      { status: 500 }
    );
  }
}
