// frontend/app/api/investors/intent/route.ts
import { NextResponse } from "next/server";
import { getDbOrNull } from "@/lib/mongo";

type IntentBody = {
  name?: string;
  email?: string;
  company?: string;
  investorType?: string;   // e.g., Angel, VC, Strategic
  focus?: string[];        // e.g., ["Trade Finance","Supply Chain"]
  ticketSize?: string;     // e.g., "250k-1M"
  notes?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as IntentBody;

    if (!body?.name || !body?.email) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields: name, email" },
        { status: 400 }
      );
    }

    const db = await getDbOrNull();
    if (!db) {
      return NextResponse.json(
        { ok: false, error: "Database not connected (set MONGO_URI & MONGO_DB)" },
        { status: 200 }
      );
    }

    const doc = {
      name: String(body.name).trim(),
      email: String(body.email).trim().toLowerCase(),
      company: String(body.company || "").trim(),
      investorType: String(body.investorType || "").trim(),
      focus: Array.isArray(body.focus) ? body.focus.map(String) : [],
      ticketSize: String(body.ticketSize || "").trim(),
      notes: String(body.notes || "").trim(),
      createdAt: new Date(),
      source: "investors/intent",
    };

    await db.collection("investor_intents").insertOne(doc);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}

// Optional: list recent intents for the admin dashboard
export async function GET() {
  try {
    const db = await getDbOrNull();
    if (!db) {
      return NextResponse.json(
        { ok: false, error: "Database not connected (set MONGO_URI & MONGO_DB)", items: [] },
        { status: 200 }
      );
    }

    const items = await db
      .collection("investor_intents")
      .find({}, { projection: { _id: 0 } })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json({ ok: true, items });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Unknown error", items: [] },
      { status: 500 }
    );
  }
}
