// frontend/lib/investorAuth.ts
import { cookies } from "next/headers";

/** Accept our canonical cookie; also allow the legacy one so old sessions don’t break. */
export function isInvestorAuthed() {
  const jar = cookies();
  const canonical = jar.get("investor_auth")?.value;
  const legacy = jar.get("gsos_investor_session")?.value;
  return canonical === "1" || Boolean(legacy);
}
