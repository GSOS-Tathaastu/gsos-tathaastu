const key = process.env.OPENAI_API_KEY;
if (!key) {
  // Keep it soft-failing in dev; hard fail in prod as you like
  console.warn("OPENAI_API_KEY not set; investor Q&A will be disabled.");
}

export function getOpenAIKey() {
  if (!key) throw new Error("OPENAI_API_KEY not set");
  return key;
}
