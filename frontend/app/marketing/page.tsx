// frontend/app/(marketing)/page.tsx
/* Server Component wrapper page for "/" */
/* Keep this file SERVER-ONLY: no "use client" here, and only ONE set of exports. */
export const revalidate = 0; // disable caching for now

import HomeLandingClient from "@/components/HomeLandingClient";

export default function MarketingPage() {
  // Wrap in a simple container in case the component is missing during build
  return (
    <main>
      <HomeLandingClient />
    </main>
  );
}
