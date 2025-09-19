// frontend/app/survey/page.tsx
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SurveyIndex() {
  const router = useRouter();
  useEffect(() => {
    const ob = sessionStorage.getItem("onboarding");
    router.replace(ob ? "/survey/questions" : "/step-zero");
  }, [router]);
  return <div className="p-4">Redirecting…</div>;
}
