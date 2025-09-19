// frontend/app/api/investors/logout/route.ts
import { NextResponse } from "next/server";
import { cookieHeaderClear } from "@/lib/cookies";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.headers.set("Set-Cookie", cookieHeaderClear());
  return res;
}
