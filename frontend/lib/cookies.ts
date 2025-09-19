// frontend/lib/cookies.ts
import crypto from "crypto";

const SECRET = process.env.INVESTOR_COOKIE_SECRET || "dev_secret_change_me";
const COOKIE_NAME = "investor_auth";

export function sign(value: string) {
  const mac = crypto.createHmac("sha256", SECRET).update(value).digest("hex");
  return `${value}.${mac}`;
}
export function verify(signed: string) {
  const [value, mac] = signed.split(".");
  if (!value || !mac) return null;
  const check = crypto.createHmac("sha256", SECRET).update(value).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(check)) ? value : null;
}

export const cookieName = COOKIE_NAME;

export function cookieHeaderSet(days = 30) {
  const max = days * 24 * 60 * 60;
  return [
    `${COOKIE_NAME}=`, // value inserted by caller
    `Path=/`,
    `HttpOnly`,
    `SameSite=Lax`,
    `Secure`,
    `Max-Age=${max}`,
  ].join("; ");
}
export function cookieHeaderClear() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0`;
}
