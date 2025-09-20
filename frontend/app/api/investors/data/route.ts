// frontend/app/api/investors/data/route.ts
import { NextResponse } from "next/server";
import { isInvestorAuthed } from "@/lib/investorAuth";

export async function GET() {
  if (!isInvestorAuthed()) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  return NextResponse.json({
    ok: true,
    brief: {
      company: "TATHAASTU / GSOS",
      oneLiner: "Intelligence layer for global trade — logistics, finance, compliance.",
      pitch: "GSOS provides real-time visibility, automated trade finance and compliance workflows to reduce costs and unlock working capital.",
      presentation: process.env.NEXT_PUBLIC_INVESTOR_PRESENTATION_URL || ""
    }
  });
}
