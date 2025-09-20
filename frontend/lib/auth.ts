// frontend/lib/auth.ts
import crypto from "crypto";

const COOKIE_NAME = "gsos_investor_session";

function getSecret() {
  return process.env.INVESTOR_COOKIE_SECRET || process.env.ADMIN_KEY || "dev-secret-please-change";
}

export function getAcceptedInvestorKey(): string | null {
  // Accept multiple env names to avoid mismatch
  const cands = [
    process.env.INVESTOR_KEY,
    process.env.INVESTOR_ACCESS_KEY,
    process.env.INVESTOR_PASSWORD,
    process.env.NEXT_PUBLIC_INVESTOR_ACCESS_KEY, // last resort (avoid for prod)
  ].filter(Boolean) as string[];

  return cands.length ? cands[0]! : null;
}

export function signToken(payload: object): string {
  const secret = getSecret();
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(data).digest("base64url");
  return `${data}.${sig}`;
}

export function verifyToken(token: string | undefined | null): any | null {
  if (!token) return null;
  const secret = getSecret();
  const [data, sig] = token.split(".");
  if (!data || !sig) return null;
  const expect = crypto.createHmac("sha256", secret).update(data).digest("base64url");
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expect))) return null;
  try {
    return JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

export const investorCookie = {
  name: COOKIE_NAME,
  // 1h default
  serialize(value: string, maxAgeSec = 3600) {
    const expires = new Date(Date.now() + maxAgeSec * 1000).toUTCString();
    return `${COOKIE_NAME}=${value}; Path=/; Expires=${expires}; Max-Age=${maxAgeSec}; HttpOnly; SameSite=Lax`;
  },
  parseCookieHeader(header: string | null | undefined): Record<string, string> {
    if (!header) return {};
    return header.split(/;\s*/).reduce((acc: any, part) => {
      const [k, v] = part.split("=");
      if (!k) return acc;
      acc[k] = v;
      return acc;
    }, {});
  },
};
