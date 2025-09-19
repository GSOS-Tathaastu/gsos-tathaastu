// frontend/app/api/investors/auth/route.ts
import { NextResponse } from "next/server";
import { cookieHeaderSet, sign } from "@/lib/cookies";

export async function POST(req: Request) {
  try {
    const { password } = await req.json();
    const expected = process.env.INVESTOR_ACCESS_KEY;
    if (!expected) return NextResponse.json({ error: "Server missing key" }, { status: 500 });
    if (!password || password !== expected) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }
    const value = sign("ok");
    const res = NextResponse.json({ ok: true });
    res.headers.set("Set-Cookie", `${cookieHeaderSet()}`.replace(`${"; HttpOnly"}`, `=${value}; HttpOnly`));
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "auth_failed" }, { status: 500 });
  }
}
