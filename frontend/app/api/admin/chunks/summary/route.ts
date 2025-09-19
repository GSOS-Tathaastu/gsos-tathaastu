// frontend/app/api/admin/chunks/summary/route.ts
import { NextResponse } from "next/server";
import { getDbOrNull } from "@/lib/mongo";

export async function GET() {
  const started = Date.now();
  const db = await getDbOrNull();

  if (!db) {
    return NextResponse.json(
      { ok: false, error: "Mongo not configured", count: 0, sample: [], latencyMs: Date.now() - started },
      { status: 200 }
    );
  }

  const names = (await db.listCollections().toArray()).map(c => c.name);
  if (!names.includes("chunks")) {
    return NextResponse.json(
      { ok: true, count: 0, sample: [], note: "No 'chunks' collection", latencyMs: Date.now() - started },
      { status: 200 }
    );
  }

  const col = db.collection("chunks");
  const count = await col.estimatedDocumentCount();

  // try to show a small sample (projection avoids huge payloads)
  const cursor = col.find({}, { projection: { _id: 1, docId: 1, title: 1, page: 1, size: 1, updatedAt: 1 } })
                    .sort({ updatedAt: -1 }).limit(10);
  const sample = await cursor.toArray();

  // try to infer basic memory/size (dbStats)
  const stats = await db.command({ collStats: "chunks", scale: 1 }).catch(() => null);

  return NextResponse.json({
    ok: true,
    count,
    sample,
    collStats: stats,
    latencyMs: Date.now() - started
  });
}
