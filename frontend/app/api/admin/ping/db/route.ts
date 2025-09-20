import { NextResponse } from "next/server";
import { getDbOrNull } from "@/lib/mongo";

export async function GET() {
  const db = await getDbOrNull();
  return NextResponse.json({ ok: !!db });
}
