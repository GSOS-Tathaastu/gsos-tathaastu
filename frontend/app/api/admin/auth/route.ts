import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const COOKIE = "gsos_admin_session";

export async function POST(req: NextRequest) {
  try {
    const { key } = await req.json();
    if (!key) return NextResponse.json({ ok: false, error: "Missing key" }, { status: 400 });

    const expected = process.env.ADMIN_KEY;
    if (!expected) return NextResponse.json({ ok: false, error: "Server misconfigured" }, { status: 500 });

    if (key !== expected) return NextResponse.json({ ok: false, error: "Invalid key" }, { status: 401 });

    const token = crypto.randomBytes(32).toString("hex");
    const res = NextResponse.json({ ok: true });

    res.cookies.set(COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60, // 1h
    });
    return res;
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Auth failed" }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, "", { maxAge: 0, path: "/" });
  return res;
}
