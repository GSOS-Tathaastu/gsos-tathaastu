import clientPromise from "@/lib/mongo";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { name, email, company, phone, amount, equity, expectedROI } = await req.json();
    if (!name || !email || !amount)
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "gsos");
    const col = db.collection("investor_intents");

    await col.insertOne({
      name,
      email: String(email).toLowerCase().trim(),
      company: company || "",
      phone: phone || "",
      amount: Number(amount),
      equity: equity ? String(equity) : "",
      expectedROI: expectedROI ? String(expectedROI) : "",
      createdAt: new Date(),
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
