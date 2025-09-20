import OpenAI from "openai";

// Pick model from env, fallback to gpt-4o-mini
export const OPENAI_MODEL =
  process.env.CHAT_MODEL ||
  process.env.OPENAI_MODEL ||
  "gpt-4o-mini";

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error("OPENAI_API_KEY is not set in environment variables");
}

// Export a single OpenAI client instance
export const openai = new OpenAI({ apiKey });
