import { NextResponse } from "next/server";
import { getDbOrNull } from "@/lib/mongo";

// Aggregates survey_sessions to compute a rough alignment score
export async function GET() {
  const db = await getDbOrNull();
  if (!db) {
    // Graceful: still return a shaped payload
    return NextResponse.json({
      ok: true,
      alignmentScore: 0,
      highlights: [],
      sampleFindings: [],
      note: "DB not connected",
    });
  }

  const ses = db.collection("survey_sessions");
  const all = await ses
    .find({}, { projection: { _id: 0, role: 1, answers: 1, questions: 1 } })
    .limit(500)
    .toArray();

  // Very basic heuristic: count how many Likert/MCQ answers are favorable
  let favorable = 0;
  let total = 0;
  const buckets: Record<string, number> = {};

  for (const s of all) {
    const role = s.role || "unknown";
    const ans = Array.isArray(s.answers) ? s.answers : [];
    for (const a of ans) {
      const v = (a?.value ?? "").toString().toLowerCase();
      if (!v) continue;
      total++;
      if (/(agree|yes|ready|strongly agree|improve|reduce)/.test(v)) favorable++;
      buckets[role] = (buckets[role] || 0) + (/(agree|yes|ready)/.test(v) ? 1 : 0);
    }
  }

  const alignment = total ? Math.round((favorable / total) * 100) : 0;
  const highlights = [
    `Aggregate favorable responses: ${favorable}/${total}`,
    `Roles with highest positive signals: ${
      Object.entries(buckets)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([r]) => r)
        .join(", ") || "n/a"
    }`,
  ];
  const sampleFindings = [
    "SMEs show interest in digitized KYC & faster LC workflows.",
    "Logistics cohorts emphasize visibility & exception handling.",
    "Compliance concerns (sanctions, AML) are recurring across roles.",
  ];

  return NextResponse.json({
    ok: true,
    alignmentScore: alignment,
    highlights,
    sampleFindings,
  });
}
