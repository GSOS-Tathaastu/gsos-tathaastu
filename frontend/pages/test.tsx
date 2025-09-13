import { useState } from "react";
import { generateSurvey, askGSOS } from "../lib/gsosClient";

export default function TestPage() {
  const [role, setRole] = useState("retailer");
  const [count, setCount] = useState(6);
  const [questions, setQuestions] = useState<any[] | null>(null);
  const [query, setQuery] = useState("");
  const [rag, setRag] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  return (
    <main style={{maxWidth:900, margin:"40px auto", fontFamily:"ui-sans-serif"}}>
      <h1>GSOS Test</h1>

      <section>
        <h2>Generate Survey</h2>
        <input value={role} onChange={e=>setRole(e.target.value)} />
        <input type="number" value={count} onChange={e=>setCount(Number(e.target.value))} />
        <button
          onClick={async()=>{ setLoading(true); setErr(null);
            try { const d = await generateSurvey(role, count); setQuestions(d.questions); }
            catch(e:any){ setErr(e.message || "error"); }
            finally{ setLoading(false); }
          }}
          disabled={loading}
        >Generate</button>
        {err && <p style={{color:"crimson"}}>{err}</p>}
        {questions && <ol>{questions.map((q:any)=>(
          <li key={q.id}><b>{q.type}</b> — {q.prompt}</li>
        ))}</ol>}
      </section>

      <section style={{marginTop:24}}>
        <h2>Ask GSOS</h2>
        <input style={{width:"100%"}}
          placeholder="Ask a question…"
          value={query} onChange={e=>setQuery(e.target.value)} />
        <button
          onClick={async()=>{ setLoading(true); setErr(null);
            try { const d = await askGSOS(query, 5); setRag(d); }
            catch(e:any){ setErr(e.message || "error"); }
            finally{ setLoading(false); }
          }}
          disabled={loading || !query.trim()}
        >Ask</button>
        {rag?.answer && <p><b>Answer:</b> {rag.answer}</p>}
        {rag?.results && rag.results.length > 0 && (
          <ul>{rag.results.map((r:any)=>(
            <li key={`${r.source_path}#${r.chunk_index}`}>
              [{r.source_path}#{r.chunk_index}] score={r.score} — {r.text.slice(0,120)}…
            </li>
          ))}</ul>
        )}
      </section>
    </main>
  );
}
