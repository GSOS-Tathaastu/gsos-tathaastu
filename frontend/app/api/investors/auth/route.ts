// frontend/app/api/investors/auth/route.ts
import { NextResponse } from "next/server";
import {
  getAcceptedInvestorKey,
  signToken,
  investorCookie,
} from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { password } = await req.json();
    if (!password) {
      return NextResponse.json(
        { ok: false, error: "Missing password" },
        { status: 400 }
      );
    }

    const expected = getAcceptedInvestorKey();
    if (!expected) {
      return NextResponse.json(
        { ok: false, error: "Investor password not configured" },
        { status: 500 }
      );
    }

    if (password !== expected) {
      return NextResponse.json(
        { ok: false, error: "Invalid password" },
        { status: 401 }
      );
    }

    // Token for investor session
    const token = signToken({ area: "investor", ts: Date.now() });

    const res = NextResponse.json({ ok: true });
    res.headers.set(
      "Set-Cookie",
      investorCookie.serialize(token, 60 * 60 * 12) // 12h
    );
    return res;
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Bad request" },
      { status: 400 }
    );
  }
}
