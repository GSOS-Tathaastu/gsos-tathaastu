"use client";
import { useEffect, useState } from "react";
// ❌ import type { QuestionMeta } from "@/lib/types";
import type { Question } from "@/lib/types"; // or inline if you prefer

export default function SurveyRunner() {
  const [sid, setSid] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/survey/next", { method: "POST" });
      const data = await res.json();
      setQuestions(data?.questions || []);
      setSid(data?.sessionId || "");
    }
    load();
  }, []);

  return (
    <div>
      <h2>Survey</h2>
      <pre>{JSON.stringify(questions, null, 2)}</pre>
    </div>
  );
}
