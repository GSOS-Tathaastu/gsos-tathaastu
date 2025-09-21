// Immediately redirect away from /login since we don't use auth anymore.
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function LoginPage() {
  redirect("/");
}
