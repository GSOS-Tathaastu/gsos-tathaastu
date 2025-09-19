// NO-OP rate limiter (disabled)
// Keep this file so existing imports don't break, but it does nothing.

type CheckResult = {
  allowed: true;
  hits?: number;
  limit?: number;
  resetAt?: Date;
};

export async function checkRateLimit(
  _req: Request | any,
  _route: string,
  _opts?: { windowMs?: number; limit?: number }
): Promise<CheckResult> {
  // Always allow
  return {
    allowed: true,
    hits: 0,
    limit: Number.MAX_SAFE_INTEGER,
    resetAt: new Date(Date.now() + 60_000),
  };
}
