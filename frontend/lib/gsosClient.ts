// frontend/lib/gsosClient.ts
export async function generateSurvey(role: string, count = 6) {
  const qs = new URLSearchParams({ path: "generate", role, count: String(count) });
  const res = await fetch(`/api/gsos?${qs.toString()}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`generate failed: ${res.status}`);
  return res.json() as Promise<{ role: string; questions: any[] }>;
}

export async function askGSOS(query: string, top_k = 5) {
  const res = await fetch(`/api/gsos?path=ask`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, top_k }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`ask failed: ${res.status}`);
  return res.json() as Promise<{ ok: boolean; results: any[]; answer?: string }>;
}
