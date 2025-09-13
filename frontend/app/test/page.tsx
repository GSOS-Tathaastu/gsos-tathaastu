"use client";
import { useState } from "react";

export default function TestPage() {
  const [role, setRole] = useState("retailer");
  const [count, setCount] = useState(6);
  const [questions, setQuestions] = useState<any[] | null>(null);
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [results, setResults] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function gen() {
    setLoading(true); setErr(null);
    try {
      const qs = new URLSearchParams({ path: "generate", role, count: String(count) });
      const r = await fetch(`/api/gsos?${qs.toString()}`, { cache: "no-store" });
      if (!r.ok) throw new Error(`generate ${r.status}`);
      const d = await r.json();
      setQuestions(d.questions);
    } catch(e:any) { setErr(e.message); } finally { setLoading(false); }
  }

  async function ask() {
    setLoading(true); setErr(null);
    try {
      const r = await fetch(`/api/gsos?path=ask`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query, top_k: 5 }),
        cache: "no-store",
      });
      if (!r.ok) throw new Error(`ask ${r.status}`);
      const d = await r.json();
      setAnswer(d.answer || null);
      setResults(d.results || []);
    } catch(e:any) { setErr(e.message); } finally { setLoading(false); }
  }

  return (
    <main style={{maxWidth:900, margin:"40px auto", fontFamily:"ui-sans-serif"}}>
      <h1>GSOS Test</h1>

      <section>
        <h2>Generate</h2>
        <input value={role} onChange={e=>setRole(e.target.value)} />
        <input type="number" value={count} onChange={e=>setCount(Number(e.target.value))} />
        <button onClick={gen} disabled={loading}>Generate</button>
        {err && <p style={{color:"crimson"}}>{err}</p>}
        {questions && <ol>{questions.map((q:any)=>(
          <li key={q.id}><b>{q.type}</b> — {q.prompt}</li>
        ))}</ol>}
      </section>

      <section style={{marginTop:24}}>
        <h2>Ask</h2>
        <input style={{width:"100%"}}
          placeholder="Ask a question…"
          value={query} onChange={e=>setQuery(e.target.value)} />
        <button onClick={ask} disabled={loading || !query.trim()}>Ask</button>
        {answer && <p><b>Answer:</b> {answer}</p>}
        {results && results.length > 0 && (
          <ul>{results.map((r:any)=>(
            <li key={`${r.source_path}#${r.chunk_index}`}>
              [{r.source_path}#{r.chunk_index}] score={r.score} — {r.text.slice(0, 120)}…
            </li>
          ))}</ul>
        )}
      </section>
    </main>
  );
}
