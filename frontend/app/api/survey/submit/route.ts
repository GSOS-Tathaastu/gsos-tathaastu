// frontend/app/api/survey/submit/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDbOrNull } from "@/lib/mongo";

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

    const db = await getDbOrNull();

    if (!db) {
      // No DB available: return success in DRY-RUN mode so UI works in dev
      return NextResponse.json(
        {
          ok: true,
          saved: false,
          mode: "DRY_RUN_NO_DB",
          echo: payload,
          note: "Mongo not configured locally; returning success without persistence.",
        },
        { status: 202 }
      );
    }

    const col = db.collection("submissions");
    const doc = { ...payload, createdAt: new Date() };
    const result = await col.insertOne(doc);

    return NextResponse.json({ ok: true, saved: true, id: result.insertedId.toString() }, { status: 201 });
  } catch (err: any) {
    const message = err?.message || "Invalid submission";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
