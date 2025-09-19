"use client";

import { useSearchParams } from "next/navigation";
import StartSurveyPage from "../start/page"; // or your actual survey runner component

export default function SurveyClient() {
  const params = useSearchParams();
  // Example: read ?sessionId=... if you need it
  const sid = params.get("sessionId") || "";

  // Render your real survey UI here. If you already have a survey component,
  // import and use it instead of StartSurveyPage.
  return <StartSurveyPage />;
}
