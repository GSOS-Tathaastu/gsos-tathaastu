// frontend/app/api/company/create/route.ts
import clientPromise from "@/lib/mongo";
import { NextResponse } from "next/server";

const required = ["companyName","contactName","email","roleMain","roleSub","aboutCompany","products"];

export async function POST(req: Request) {
  try {
    const body = await req.json();

    for (const r of required) {
      if (!body?.[r] || String(body[r]).trim() === "") {
        return NextResponse.json({ error: `Missing or empty: ${r}` }, { status: 400 });
      }
    }

    const revGlobalPct = Number(body.revenueGlobalPct ?? 0);
    const revenueGlobalPct = isFinite(revGlobalPct) && revGlobalPct >= 0 && revGlobalPct <= 100 ? revGlobalPct : 0;
    const revenueDomesticPct = Math.max(0, Math.min(100, 100 - revenueGlobalPct));

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "gsos");
    const companies = db.collection("companies");

    const now = new Date();
    const doc = {
      companyName: String(body.companyName).trim(),
      website: (body.website || "").trim(),
      contactName: String(body.contactName).trim(),
      email: String(body.email).toLowerCase().trim(),
      phone: (body.phone || "").trim(),

      roleMain: String(body.roleMain),
      roleSub: String(body.roleSub),
      role: String(body.role || body.roleMain),

      country: body.country || "India",
      preferredCurrency: body.preferredCurrency || "INR",

      aboutCompany: (body.aboutCompany || "").trim(),
      products: (body.products || "").trim(),
      annualRevenue: Number(body.annualRevenue || 0),
      annualRevenueCurrency: String(body.annualRevenueCurrency || body.preferredCurrency || "INR"),
      painAreas: (body.painAreas || "").trim(),
      revenueGlobalPct,
      revenueDomesticPct,

      b2bPlatforms: Array.isArray(body.b2bPlatforms) ? body.b2bPlatforms : [],
      b2cPlatforms: Array.isArray(body.b2cPlatforms) ? body.b2cPlatforms : [],
      otherPlatform: (body.otherPlatform || "").trim(),

      consent: Boolean(body.consent),

      createdAt: now,
      updatedAt: now,
      meta: {
        ua: req.headers.get("user-agent") || "",
        ip: req.headers.get("x-forwarded-for") || "",
      },
    };

    const { insertedId } = await companies.insertOne(doc as any);

    const onboarding = {
      companyName: doc.companyName,
      roleMain: doc.roleMain,
      roleSub: doc.roleSub,
      role: doc.role,
      country: doc.country,
      currency: doc.preferredCurrency,
      aboutCompany: doc.aboutCompany,
      products: doc.products,
      annualRevenue: doc.annualRevenue,
      annualRevenueCurrency: doc.annualRevenueCurrency,
      painAreas: doc.painAreas,
      revenueGlobalPct: doc.revenueGlobalPct,
      revenueDomesticPct: doc.revenueDomesticPct,
      b2bPlatforms: doc.b2bPlatforms,
      b2cPlatforms: doc.b2cPlatforms,
      otherPlatform: doc.otherPlatform,
    };

    return NextResponse.json({ ok: true, id: insertedId, next: "/survey", onboarding }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}
