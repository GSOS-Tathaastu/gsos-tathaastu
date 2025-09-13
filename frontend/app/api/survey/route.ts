import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { Onboarding } from "@/lib/models";
import { computeScore, mapBlueprint } from "@/lib/score";
import { surveyReceiptEmail } from "@/lib/emailTemplates";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const onboarding = body.onboarding;
  const answers = body.answers || {};
  const email: string | undefined = body.email || body.onboarding?.email;
  const name: string | undefined = body.name || body.onboarding?.name;

  if (!onboarding) {
    return NextResponse.json({ error: "missing_onboarding" }, { status: 400 });
  }

  const score = computeScore(answers);
  const blueprint = mapBlueprint(onboarding.painArea || "");

  Onboarding.parse(onboarding);

  const db = await getDb();
  const doc = {
    onboarding,
    answers,
    score,
    blueprint,
    createdAt: new Date()
  };
  const { insertedId } = await db.collection("surveys").insertOne(doc);

  if (email && process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const { subject, html } = surveyReceiptEmail({
      name,
      role: onboarding.role,
      score,
      modules: blueprint.modules,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL
    });
    fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ""}/api/mail`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ to: email, subject, html })
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true, id: insertedId.toString(), score, blueprint });
}
