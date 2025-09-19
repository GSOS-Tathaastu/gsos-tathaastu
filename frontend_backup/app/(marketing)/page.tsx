/* Server Component wrapper page for "/" */
/* Keep this file SERVER-ONLY: no "use client" here, and only ONE set of exports. */
export const revalidate = 0; // or remove this line if you use default caching

import HomeLandingClient from "@/components/HomeLandingClient";

export default function Page() {
  return <HomeLandingClient />;
}
