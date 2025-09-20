import { NextResponse } from "next/server";
import { getDbOrNull } from "@/lib/mongo";

export async function GET() {
  const db = await getDbOrNull();
  if (!db) return NextResponse.json({ ok: false, error: "DB not connected" }, { status: 500 });

  const out = await db.collection("chunks")
    .find({}, { projection: { _id: 0 } })
    .limit(50)
    .toArray();

  return NextResponse.json({ ok: true, count: out.length, sample: out });
}
