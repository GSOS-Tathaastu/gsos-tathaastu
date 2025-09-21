import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  INVESTOR_COOKIE,
  getExpectedPassword,
  signToken,
} from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { area, password } = await req.json();
    if (area !== "admin" && area !== "investor") {
      return NextResponse.json(
        { ok: false, error: "Invalid area" },
        { status: 400 }
      );
    }

    const expected = getExpectedPassword(area);
    if (!expected) {
      return NextResponse.json(
        { ok: false, error: `Password for ${area} not configured` },
        { status: 500 }
      );
    }

    if (password !== expected) {
      return NextResponse.json(
        { ok: false, error: "Invalid password" },
        { status: 401 }
      );
    }

    // Sign token with payload
    const token = signToken({ area, ts: Date.now() });
    const cookieName = area === "admin" ? ADMIN_COOKIE : INVESTOR_COOKIE;

    const res = NextResponse.json({ ok: true, area });
    res.cookies.set(cookieName, token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12, // 12h
    });

    return res;
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Bad request" },
      { status: 400 }
    );
  }
}
