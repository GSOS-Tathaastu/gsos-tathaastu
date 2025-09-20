import OpenAI from "openai";
import { getDbOrNull } from "@/lib/mongo";

// Pick model from env, fallback to gpt-4o-mini
const CHAT_MODEL =
  process.env.CHAT_MODEL ||
  process.env.OPENAI_MODEL ||
  "gpt-4o-mini";

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  // Fail fast at runtime with a clear message
  throw new Error("OPENAI_API_KEY is not set in environment variables");
}

// Exported OpenAI client
export const openai = new OpenAI({ apiKey });

/**
 * Usage record stored in DB or buffer.
 */
type UsageRec = {
  ts: Date;
  endpoint: "chat";
  model: string;
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  feature?: string; // optional grouping feature
};

/**
 * Try to record token usage to MongoDB, fallback to in-memory buffer.
 */
async function recordUsage(u: UsageRec) {
  try {
    const db = await getDbOrNull();
    if (db) {
      await db.collection("ai_usage").insertOne(u);
      return;
    }
  } catch {
    // ignore DB errors, fallback
  }
  try {
    const line = JSON.stringify(u) + "\n";
    // @ts-ignore: attach to global buffer for debugging
    (global as any).__AI_USAGE_BUFFER__ =
      ((global as any).__AI_USAGE_BUFFER__ || "") + line;
  } catch {
    // swallow all errors silently
  }
}

/**
 * Wrapper for chat completions with token usage logging.
 * NOTE: We explicitly disable streaming here to avoid union type issues.
 */
export async function chatWithFallback(
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  opts: Partial<OpenAI.Chat.Completions.ChatCompletionCreateParams> = {},
  feature?: string
): Promise<string> {
  // Ensure non-streaming (so result is ChatCompletion, not Stream<ChatCompletionChunk>)
  const { stream: _ignoreStream, ...rest } = opts as any;

  const res = await openai.chat.completions.create({
    model: CHAT_MODEL,
    messages,
    temperature: 0.2,
    stream: false, // <- force non-streaming to keep types simple
    ...rest,
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
