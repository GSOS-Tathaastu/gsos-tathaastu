// frontend/lib/ai.ts
import OpenAI from "openai";
import { getDbOrNull } from "@/lib/mongo";

const CHAT_MODEL = process.env.CHAT_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

type UsageRec = {
  ts: Date;
  endpoint: "chat";
  model: string;
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  // optional rolling id to group by feature
  feature?: string;
};

async function recordUsage(u: UsageRec) {
  try {
    const db = await getDbOrNull();
    if (db) {
      await db.collection("ai_usage").insertOne(u);
      return;
    }
  } catch {
    // fall through to file log
  }
  try {
    // fallback file log (best-effort)
    const line = JSON.stringify(u) + "\n";
    // @ts-ignore
    (global as any).__AI_USAGE_BUFFER__ = ((global as any).__AI_USAGE_BUFFER__ || "") + line;
    // You can extend to fs.appendFile if you prefer, but many hosts are read-only
  } catch {}
}

export async function chatWithFallback(messages: any[], opts: Partial<OpenAI.Chat.Completions.ChatCompletionCreateParams> = {}, feature?: string) {
  const res = await openai.chat.completions.create({
    model: CHAT_MODEL,
    messages,
    temperature: 0.2,
    ...opts,
  });

  const text = res.choices?.[0]?.message?.content || "";
  const use = (res as any).usage || {};
  await recordUsage({
    ts: new Date(),
    endpoint: "chat",
    model: res.model || CHAT_MODEL,
    prompt_tokens: use.prompt_tokens,
    completion_tokens: use.completion_tokens,
    total_tokens: use.total_tokens,
    feature,
  });

  return text;
}
