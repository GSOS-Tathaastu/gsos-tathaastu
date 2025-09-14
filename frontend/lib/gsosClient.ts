// frontend/lib/gsosClient.ts
export type GeneratedQuestion =
  | {
      id: string;
      type: "mcq";
      prompt: string;
      options?: string[];
      multi?: boolean;
    }
  | {
      id: string;
      type: "likert";
      prompt: string;
      min?: number;
      max?: number;
    }
  | {
      id: string;
      type: "short_text";
      prompt: string;
    };

export type AnalyzePayload =
  | { id: string; type: "mcq"; values: string[] }
  | { id: string; type: "likert"; value: number }
  | { id: string; type: "short_text"; value: string };

export type AnalyzeResult = {
  ok: boolean;
  savings: {
    inventory_reduction_pct: number;
    stockout_reduction_pct: number;
    otd_improvement_pct: number;
    notes: string;
  };
  summary: string | null;
  citations: { source: string; chunk: number }[];
  plans: { name: string; price_range: string; features: string[]; fit: string }[];
  onboarding: { question: string; options: string[] };
  meta: Record<string, unknown>;
};

export async function generateSurvey(role: string, count = 12) {
  const qs = new URLSearchParams({ path: "generate", role, count: String(count) });
  const res = await fetch(`/api/gsos?${qs.toString()}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`generate failed: ${res.status}`);
  return res.json() as Promise<{ role: string; questions: GeneratedQuestion[] }>;
}

export async function analyzeSurvey(role: string, answers: AnalyzePayload[]) {
  const body = JSON.stringify({ role, answers });
  const res = await fetch(`/api/gsos?path=analyze`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`analyze failed: ${res.status}`);
  return res.json() as Promise<AnalyzeResult>;
}
