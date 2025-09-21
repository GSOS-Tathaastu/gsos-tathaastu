// Server component: send folks straight to the investors dashboard (or keep your content here).
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function InvestorsLanding() {
  // If you have a dashboard route, redirect there.
  // Change to your preferred destination if needed.
  redirect("/investors/dashboard");
}
