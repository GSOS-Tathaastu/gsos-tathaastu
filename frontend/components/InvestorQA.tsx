"use client";

import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

export default function InvestorQA() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hi! I’m the GSOS assistant. Ask about the product, market, traction, revenue model, or roadmap.",
    },
  ]);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, loading]);

  async function ask() {
    const q = question.trim();
    if (!q) return;
    setQuestion("");
    setMsgs((m) => [...m, { role: "user", content: q }]);
    setLoading(true);
    try {
      const r = await fetch("/api/investors/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const j = await r.json();
      setMsgs((m) => [
        ...m,
        { role: "assistant", content: j?.answer || "No answer." },
      ]);
    } catch (e: any) {
      setMsgs((m) => [
        ...m,
        { role: "assistant", content: "Network error. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function key(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      ask();
    }
  }

  return (
    <div className="space-y-4">
      <div className="h-[320px] overflow-y-auto rounded-xl border bg-gray-50 p-3">
        {msgs.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] mb-2 p-3 rounded-xl ${
              m.role === "user"
                ? "ml-auto bg-indigo-600 text-white"
                : "bg-white border"
            }`}
          >
            {m.content}
          </div>
        ))}
        {loading && (
          <div className="text-sm text-gray-500 px-2 py-1">Thinking…</div>
        )}
        <div ref={endRef} />
      </div>

      <div className="flex gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={key}
          placeholder="Ask anything (e.g., What’s the GTM and pricing?)"
          className="flex-1 rounded-xl border px-3 py-2"
        />
        <button
          onClick={ask}
          disabled={loading}
          className="rounded-xl bg-black text-white px-4 py-2 hover:bg-gray-900 disabled:opacity-60"
        >
          Send
        </button>
      </div>

      <div className="text-xs text-gray-500">
        Answers may use public data and your uploaded content. No confidential
        info is stored.
      </div>
    </div>
  );
}
