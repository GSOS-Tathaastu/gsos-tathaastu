import crypto from "crypto";

export const ADMIN_COOKIE = "gsos_admin_session";
export const INVESTOR_COOKIE = "gsos_investor_session";

function getSecret() {
  return (
    process.env.SESSION_SECRET ||
    process.env.INVESTOR_COOKIE_SECRET ||
    process.env.ADMIN_KEY ||
    "dev-secret-change-me"
  );
}

// ---- Passwords from env ----
export function getExpectedPassword(area: "admin" | "investor"): string | null {
  if (area === "admin") {
    return process.env.ADMIN_PASSWORD || null;
  }
  const cands = [
    process.env.INVESTOR_PASSWORD,
    process.env.INVESTOR_KEY,
    process.env.INVESTOR_ACCESS_KEY,
    process.env.NEXT_PUBLIC_INVESTOR_ACCESS_KEY, // last resort
  ].filter(Boolean) as string[];
  return cands.length ? cands[0]! : null;
}

// ---- Token helpers ----
export function signToken(payload: object): string {
  const secret = getSecret();
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("base64url");
  return `${data}.${sig}`;
}

export function verifyToken(token?: string | null): any | null {
  if (!token) return null;
  const secret = getSecret();
  const [data, sig] = token.split(".");
  if (!data || !sig) return null;
  const expect = crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("base64url");
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expect))) return null;
  try {
    return JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

// ---- Backward compatibility exports ----
export function getAcceptedInvestorKey(): string | null {
  return getExpectedPassword("investor");
}

const LEGACY_INVESTOR_COOKIE = "gsos_investor_session";

export const investorCookie = {
  name: LEGACY_INVESTOR_COOKIE,
  serialize(value: string, maxAgeSec = 3600) {
    const expires = new Date(Date.now() + maxAgeSec * 1000).toUTCString();
    return `${LEGACY_INVESTOR_COOKIE}=${value}; Path=/; Expires=${expires}; Max-Age=${maxAgeSec}; HttpOnly; SameSite=Lax`;
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
