// frontend/app/api/investors/auth/route.ts
import { NextResponse } from "next/server";
import { getAcceptedInvestorKey, signToken, investorCookie } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const postedKey = (body?.key || "").toString().trim();

    const accepted = getAcceptedInvestorKey();

    const visibility = {
      INVESTOR_KEY: !!process.env.INVESTOR_KEY,
      INVESTOR_ACCESS_KEY: !!process.env.INVESTOR_ACCESS_KEY,
      INVESTOR_PASSWORD: !!process.env.INVESTOR_PASSWORD,
      NEXT_PUBLIC_INVESTOR_ACCESS_KEY: !!process.env.NEXT_PUBLIC_INVESTOR_ACCESS_KEY,
    };

    if (!accepted) {
      return NextResponse.json(
        { ok: false, error: "Investor access key not configured on server", visibility },
        { status: 200 }
      );
    }

    if (postedKey !== accepted) {
      return NextResponse.json(
        { ok: false, error: "Invalid key", visibility },
        { status: 200 }
      );
    }

    const token = signToken({ role: "investor", ts: Date.now() });
    const res = NextResponse.json({ ok: true });
    res.headers.append("Set-Cookie", investorCookie.serialize(token, 3600));
    return res;
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "auth_failed" }, { status: 500 });
  }
}
