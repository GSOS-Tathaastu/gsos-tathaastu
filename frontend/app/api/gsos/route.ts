import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const path = sp.get("path");
  if (path === "generate") {
    const role = sp.get("role") || "retailer";
    const count = sp.get("count") || "12";
    const url = `${process.env.NEXT_PUBLIC_SITE_URL || ""}/api/survey/generate?role=${encodeURIComponent(role)}&count=${encodeURIComponent(count)}`;
    const r = await fetch(url, { cache: "no-store" });
    const j = await r.json();
    return NextResponse.json(j, { status: r.status });
  }
  return NextResponse.json({ error: "unknown" }, { status: 404 });
}
