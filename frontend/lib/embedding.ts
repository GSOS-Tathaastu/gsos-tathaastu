// frontend/lib/embedding.ts
import { openai } from "./openai";

export async function embedTexts(texts: string[]): Promise<number[][]> {
  // Fallback to zeros if no key (keeps build & tests alive)
  if (!process.env.OPENAI_API_KEY) {
    return texts.map(() => Array(768).fill(0));
  }
  const res = await openai.embeddings.create({
    model: process.env.OPENAI_EMBED_MODEL || "text-embedding-3-small",
    input: texts,
  });
  return res.data.map((d) => d.embedding as number[]);
}

export function cosine(a: number[], b: number[]) {
  let dot = 0,
    na = 0,
    nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb) || 1;
  return dot / denom;
}
