// frontend/app/api/investors/analytics/route.ts
import { NextResponse } from "next/server";
import { getDbOrNull } from "@/lib/mongo";

export async function GET() {
  try {
    const db = await getDbOrNull();

    if (!db) {
      return NextResponse.json(
        {
          ok: false,
          error: "Database not connected (set MONGO_URI & MONGO_DB)",
          stats: { submissions: 0, companies: 0, intents: 0, questions: 0 },
        },
        { status: 200 }
      );
    }

    const names = new Set((await db.listCollections().toArray()).map((c) => c.name));
    const safeCount = async (name: string) => (names.has(name) ? db.collection(name).countDocuments({}) : 0);

    const [submissions, companies, intents, questions] = await Promise.all([
      safeCount("submissions"),
      safeCount("companies"),
      safeCount("investor_intents"),
      safeCount("investor_questions"),
    ]);

    return NextResponse.json({
      ok: true,
      stats: { submissions, companies, intents, questions },
      ts: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
