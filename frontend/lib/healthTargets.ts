// frontend/lib/healthTargets.ts
export type TargetKey = "nextApi" | "mongo" | "backend";

export const TARGETS: { key: TargetKey; label: string; description: string }[] = [
  { key: "nextApi", label: "Next.js API", description: "App routes on Vercel/local" },
  { key: "mongo", label: "MongoDB", description: "Atlas connection & ping" },
  { key: "backend", label: "Railway Backend", description: "External service /health" },
];
