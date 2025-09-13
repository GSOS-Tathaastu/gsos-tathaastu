import { useState } from "react";
import { generateSurvey, askGSOS } from "../lib/gsosClient";

export default function HomePage() {
  const [role, setRole] = useState("retailer");
  const [count, setCount] = useState(6);
  const [questions, setQuestions] = useState<any[] | null>(null);

  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [chunks, setChunks] = useState<any[] | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onGenerate() {
    setLoading(true);
    setError(null);
    try {
      const data = await generateSurvey(role, count);
      setQuestions(data.questions);
    } catch (e: any) {
      setError(e.message || "Error generating survey");
    } finally {
      setLoading(false);
    }
  }

  async function onAsk() {
    setLoading(true);
    setError(null);
    try {
      const data = await askGSOS(query, 5);
      setAnswer(data.answer || null);
      setChunks(data.results || []);
    } catch (e: any) {
      setError(e.message || "Error querying GSOS");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 900, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h1>GSOS-TATHAASTU Demo</h1>

      <section style={{ marginTop: 24 }}>
        <h2>Generate Survey</h2>
        <input value={role} onChange={(e) => setRole(e.target.value)} />
        <input
          type="number"
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
        />
        <button onClick={onGenerate} disabled={loading}>
          Generate
        </button>

        {error && <p style={{ color: "red" }}>{error}</p>}

        {questions && (
          <ol style={{ marginTop: 12 }}>
            {questions.map((q, i) => (
              <li key={i}>
                <strong>{q.type?.toUpperCase()}</strong>: {q.prompt}
              </li>
            ))}
          </ol>
        )}
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>Ask GSOS</h2>
        <input
          style={{ width: "100%" }}
          placeholder="Ask a question…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button onClick={onAsk} disabled={loading || !query.trim()}>
          Ask
        </button>

        {answer && (
          <p style={{ marginTop: 12 }}>
            <strong>Answer:</strong> {answer}
          </p>
        )}

        {chunks && chunks.length > 0 && (
          <ul style={{ marginTop: 12 }}>
            {chunks.map((c, i) => (
              <li key={i}>
                [{c.source_path}#{c.chunk_index}] score={c.score} —{" "}
                {c.text.slice(0, 120)}…
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
