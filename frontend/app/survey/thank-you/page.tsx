"use client";
import React, { useEffect, useState } from "react";

export default function TY() {
  const [score, setScore] = useState<number|undefined>();
  const [modules, setModules] = useState<string[]>([]);

  useEffect(() => {
    const res = sessionStorage.getItem("results");
    if (res) {
      const { score, blueprint } = JSON.parse(res);
      setScore(score);
      setModules(blueprint?.modules || []);
    }
  }, []);

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-semibold mb-3">Thank you!</h1>
      <p className="mb-6">We’ve recorded your responses and will follow up with a personalized blueprint.</p>
      {typeof score === "number" && (
        <div className="border rounded-xl p-4 mb-6">
          <div className="text-xl font-medium">GSOS Readiness Score: {score}/100</div>
          {modules.length ? <div className="mt-2">Suggested Modules: {modules.join(", ")}</div> : null}
        </div>
      )}
      <a href="/" className="text-indigo-600 underline">Back to home</a>
    </main>
  );
}
