// frontend/app/api/company/create/route.ts
import { NextResponse } from "next/server";
import { getDbOrNull } from "@/lib/mongo";

const required = [
  "companyName",
  "contactName",
  "email",
  "roleMain",
  "roleSub",
  "aboutCompany",
  "products"
];

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // basic required checks
    const missing = required.filter((k) => !body?.[k]);
    if (missing.length) {
      return NextResponse.json(
        { ok: false, error: `Missing fields: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    const db = await getDbOrNull();
    if (!db) {
      // Dev-friendly: allow working without Mongo locally
      return NextResponse.json(
        {
          ok: true,
          saved: false,
          mode: "DRY_RUN_NO_DB",
          echo: body,
          note: "Mongo not configured; returning success without persistence."
        },
        { status: 202 }
      );
    }

    const result = await db.collection("companies").insertOne({
      ...body,
      createdAt: new Date()
    });

    return NextResponse.json(
      { ok: true, saved: true, id: result.insertedId.toString() },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Invalid payload" },
      { status: 400 }
    );
  }
}
