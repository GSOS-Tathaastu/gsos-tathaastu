// frontend/app/api/survey/start/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
const COOKIE = "gsos_svy";
const DAYS = 7;

type Step0Profile = {
  companyName: string;
  rolePrimary?: string;
  roleSecondary?: string;
  country?: string;
  preferredCurrency?: string;
};

function safeParse<T=any>(s: string | undefined | null): T | null {
  if (!s) return null;
  try { return JSON.parse(s) as T; } catch { return null; }
}

export async function GET() {
  try {
    const jar = cookies();
    const raw = jar.get(COOKIE)?.value;
    const session = safeParse(raw);
    if (!session) return NextResponse.json({ error: "no_session" }, { status: 404 });
    return NextResponse.json({ ok: true, session }, { status: 200 });
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || "start_get_failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const profile: Step0Profile = body?.profile || {};

    if (!profile.companyName || !profile.companyName.trim()) {
      return NextResponse.json({ error: "companyName_required" }, { status: 400 });
    }

    const session = {
      id: `svy_${Math.random().toString(36).slice(2, 10)}`,
      createdAt: Date.now(),
      profile,
    };

    const jar = cookies();
    const expires = new Date(Date.now() + DAYS * 24 * 60 * 60 * 1000);
    jar.set(COOKIE, JSON.stringify(session), {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      expires,
      path: "/",
    });

    return NextResponse.json({ ok: true, session }, { status: 200 });
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || "start_post_failed" }, { status: 500 });
  }
}
