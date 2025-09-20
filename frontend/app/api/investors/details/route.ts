import { NextResponse } from "next/server";
import { getDbOrNull } from "@/lib/mongo";

// Same cookie as your investor auth flow
function isInvestor(req: Request) {
  const cookie = req.headers.get("cookie") || "";
  return /investor_session=ok/.test(cookie);
}

export async function POST(req: Request) {
  if (!isInvestor(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  let body: any = {};
  try { body = await req.json(); } catch { /* ignore */ }

  const { name, org, email, ticket, equity, notes } = body || {};
  const db = await getDbOrNull();
  if (!db) return NextResponse.json({ ok: false, error: "DB not connected" }, { status: 500 });

  const col = db.collection("investors");
  await col.updateOne(
    { email: (email || "").toLowerCase().trim() || null, org: org || null },
    {
      $set: {
        name: name || "",
        org: org || "",
        email: (email || "").toLowerCase().trim(),
        ticket: ticket || "",
        equity: equity || "",
        notes: notes || "",
        updatedAt: new Date(),
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true }
  );

  return NextResponse.json({ ok: true });
}
