// frontend/app/api/investors/data/route.ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verify, cookieName } from "@/lib/cookies";

export async function GET() {
  const c = cookies().get(cookieName)?.value;
  if (!c || verify(c) !== "ok") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json({ ok: true, investor: { role: "allowed" } }, { headers: { "Cache-Control": "no-store" } });
}
