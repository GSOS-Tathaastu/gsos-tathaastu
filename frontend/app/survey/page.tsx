import { Suspense } from "react";
import SurveyClient from "./SurveyClient";

export const dynamic = "force-dynamic";  // avoid static prerender issues
export const revalidate = 0;             // don't cache

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Loading survey…</div>}>
      <SurveyClient />
    </Suspense>
  );
}
