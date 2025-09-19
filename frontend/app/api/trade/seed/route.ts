// frontend/app/api/trade/seed/route.ts
import { NextResponse } from "next/server";
import { getDbOrNull } from "@/lib/mongo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST() {
  try {
    const db = await getDbOrNull();
    if (!db) return NextResponse.json({ ok: false, error: "DB not connected" }, { status: 200 });

    const col = db.collection("trade_cache");
    const doc = {
      fetchedAt: new Date(),
      kpis: [
        { label: "Global exports (USD)", value: "$25.3T" },
        { label: "Global imports (USD)", value: "$24.9T" },
        { label: "YoY growth", value: "+3.1%" },
      ],
      topFlows: [
        { from: "China", to: "USA", value: 690_000_000_000 },
        { from: "EU", to: "USA", value: 720_000_000_000 },
        { from: "USA", to: "Mexico", value: 800_000_000_000 },
        { from: "Japan", to: "USA", value: 210_000_000_000 },
        { from: "India", to: "UAE", value: 85_000_000_000 },
      ],
    };

    await col.insertOne(doc);
    return NextResponse.json({ ok: true, inserted: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "seed failed" }, { status: 500 });
  }
}
