// frontend/app/api/admin/metrics/route.ts
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongo";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client?.db();

    // If DB is not available, return graceful error
    if (!db) {
      return NextResponse.json({
        ok: false,
        error: "Database connection not available",
        counts: { submissions: 0, users: 0, chunks: 0 },
      });
    }

    const collections = await db.listCollections().toArray();
    const names = collections.map((c) => c.name);

    const counts: Record<string, number> = {
      submissions: 0,
      users: 0,
      chunks: 0,
    };

    async function safeCount(name: string) {
      if (!names.includes(name)) return 0;
      return await db.collection(name).countDocuments({});
    }

    counts.submissions = await safeCount("submissions");
    counts.users = await safeCount("users");
    counts.chunks = await safeCount("chunks");

    return NextResponse.json({
      ok: true,
      counts,
    });
  } catch (err: any) {
    console.error("Metrics API error:", err);
    return NextResponse.json(
      {
        ok: false,
        error: err.message || "Unknown error",
        counts: { submissions: 0, users: 0, chunks: 0 },
      },
      { status: 500 }
    );
  }
}
