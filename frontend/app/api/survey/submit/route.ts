// frontend/app/api/survey/submit/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/mongo";

const SubmissionSchema = z.object({
  profile: z.object({
    company: z.string().min(1),
    role: z.string().min(1),
    country: z.string().min(1),
  }),
  answers: z.record(z.any()),
  meta: z.object({
    userAgent: z.string().optional(),
    ts: z.number().optional(),
  }).optional(),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const payload = SubmissionSchema.parse(json);

    const db = await getDb();
    const col = db.collection("submissions");

    const doc = {
      ...payload,
      createdAt: new Date(),
    };
    await col.insertOne(doc);

    return NextResponse.json({ ok: true, id: doc["_id"]?.toString?.() }, { status: 201 });
  } catch (err: any) {
    const message = err?.message || "Invalid submission";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
