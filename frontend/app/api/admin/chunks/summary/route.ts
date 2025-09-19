// frontend/app/api/admin/chunks/summary/route.ts
import { NextResponse } from "next/server";
import { getDbOrNull } from "@/lib/mongo";

export async function GET() {
  const started = Date.now();
  const db = await getDbOrNull();

  if (!db) {
    return NextResponse.json(
      {
        ok: false,
        error: "Mongo not configured (set MONGO_URI & MONGO_DB)",
        count: 0,
        sample: [],
        latencyMs: Date.now() - started,
      },
      { status: 200 }
    );
  }

  try {
    const names = (await db.listCollections().toArray()).map((c) => c.name);
    if (!names.includes("chunks")) {
      return NextResponse.json(
        {
          ok: true,
          count: 0,
          sample: [],
          note: "No 'chunks' collection",
          latencyMs: Date.now() - started,
        },
        { status: 200 }
      );
    }

    const col = db.collection("chunks");
    const count = await col.estimatedDocumentCount();

    const sample = await col
      .find(
        {},
        { projection: { _id: 1, docId: 1, title: 1, page: 1, size: 1, updatedAt: 1 } }
      )
      .sort({ updatedAt: -1 })
      .limit(10)
      .toArray();

    const collStats = await db
      .command({ collStats: "chunks", scale: 1 })
      .catch(() => null);

    return NextResponse.json({
      ok: true,
      count,
      sample,
      collStats,
      latencyMs: Date.now() - started,
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        ok: false,
        error: e?.message || "Failed to read chunks",
        count: 0,
        sample: [],
        latencyMs: Date.now() - started,
      },
      { status: 200 }
    );
  }
}
