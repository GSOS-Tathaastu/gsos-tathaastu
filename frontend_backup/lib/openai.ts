// frontend/lib/openai.ts
import OpenAI from "openai";

const key = process.env.OPENAI_API_KEY;
if (!key) throw new Error("OPENAI_API_KEY missing");

export const openai = new OpenAI({
  apiKey: key,
  ...(process.env.OPENAI_PROJECT_ID ? { project: process.env.OPENAI_PROJECT_ID } : {}),
  ...(process.env.OPENAI_ORG_ID ? { organization: process.env.OPENAI_ORG_ID } : {}),
});

export const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
