// frontend/app/api/investors/submit/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDbOrNull } from "@/lib/mongo";
import fs from "fs";
import path from "path";

const COOKIE = "investor_auth";

async function saveDoc(doc: any) {
  const db = await getDbOrNull();
  if (db) {
    const r = await db.collection("investors").insertOne(doc);
    return String(r.insertedId);
  }
  const dir = path.join(process.cwd(), "data", "investors");
  fs.mkdirSync(dir, { recursive: true });
  const id = `inv_${Date.now()}`;
  fs.writeFileSync(path.join(dir, `${id}.json`), JSON.stringify(doc, null, 2), "utf8");
  return id;
}

export async function POST(req: Request) {
  const authed = cookies().get(COOKIE)?.value === "1";
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const required = ["name", "email", "amount", "equity"];
  for (const r of required) if (!body?.[r]) return NextResponse.json({ error: `${r} required` }, { status: 400 });

  const doc = {
    name: body.name, email: body.email, amount: body.amount, equity: body.equity,
    notes: body.notes || "", askedAt: new Date().toISOString(),
    meta: { ua: req.headers.get("user-agent") || null, ip: req.headers.get("x-forwarded-for") || null }
  };
  try {
    const id = await saveDoc(doc);
    return NextResponse.json({ ok: true, id });
  } catch {
    return NextResponse.json({ error: "failed_to_save" }, { status: 500 });
  }
}
