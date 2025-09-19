export async function GET() {
  const apiKey = process.env.OPENAI_API_KEY || "";
  const project = process.env.OPENAI_PROJECT_ID || "";
  const org = process.env.OPENAI_ORG_ID || "";

  const mask = (s: string) =>
    s ? `${s.slice(0, 6)}…${s.slice(-4)}` : "(empty)";

  return new Response(
    JSON.stringify({
      keyPrefix: apiKey.startsWith("sk-proj-") ? "sk-proj-" : apiKey.startsWith("sk-") ? "sk-" : "(unknown)",
      apiKeyMasked: mask(apiKey),
      hasProjectId: !!project,
      projectMasked: mask(project),
      hasOrgId: !!org,
      orgMasked: mask(org),
      nodeEnv: process.env.NODE_ENV,
    }),
    { status: 200, headers: { "content-type": "application/json" } }
  );
}
