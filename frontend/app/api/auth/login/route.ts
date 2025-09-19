import { NextResponse } from "next/server";

const ADMIN_COOKIE = "auth_admin";
const INVESTOR_COOKIE = "auth_investor";

export async function POST(req: Request) {
  try {
    const { area, password } = await req.json();
    if (!area || !password) {
      return NextResponse.json({ ok: false, error: "Missing area or password" }, { status: 400 });
    }
    const isAdmin = area === "admin";
    const isInvestor = area === "investor";
    if (!isAdmin && !isInvestor) {
      return NextResponse.json({ ok: false, error: "Invalid area" }, { status: 400 });
    }
    const expected = isAdmin ? process.env.ADMIN_PASSWORD : process.env.INVESTOR_PASSWORD;
    if (!expected) {
      return NextResponse.json({ ok: false, error: "Password not configured on server" }, { status: 500 });
    }
    if (password !== expected) {
      return NextResponse.json({ ok: false, error: "Invalid password" }, { status: 401 });
    }
    const res = NextResponse.json({ ok: true, area });
    const cookieName = isAdmin ? ADMIN_COOKIE : INVESTOR_COOKIE;
    res.cookies.set(cookieName, "1", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
    });
    return res;
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Bad request" }, { status: 400 });
  }
}
