// frontend/app/api/admin/chunks/summary/route.ts
import { NextResponse } from "next/server";
import { getDbOrNull } from "@/lib/mongo";
import { getChunks } from "@/lib/chunks";

export async function GET() {
  const started = Date.now();
  try {
    const db = await getDbOrNull();
    const { source, chunks } = await getChunks(db);

    const sample = chunks.slice(0, 10).map((c) => ({
      id: c.id,
      title: c.title,
      tags: c.tags,
      size: c.text?.length || 0,
    }));

    return NextResponse.json({
      ok: true,
      source,                   // "db" or "local"
      count: chunks.length,
      sample,
      latencyMs: Date.now() - started,
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        ok: false,
        error: e?.message || "Failed to summarize chunks",
        source: "unknown",
        count: 0,
        sample: [],
        latencyMs: Date.now() - started,
      },
      { status: 200 }
    );
  }
}
