"use client";
import { useState } from "react";

function Field({ label, ...props }: any){
  return (
    <label className="text-sm space-y-1">
      <div className="opacity-80">{label}</div>
      <input {...props} className="w-full p-2 border rounded-xl" />
    </label>
  );
}

export default function InvestorForms(){
  const [contact, setContact] = useState({ name:"", email:"", company:"", phone:"" });
  const [intent, setIntent] = useState({ amount:"", equity:"", expectedROI:"" });
  const [q, setQ] = useState(""); const [a, setA] = useState("");
  const [loadingQA, setLoadingQA] = useState(false);
  const [msg, setMsg] = useState("");

  const saveIntent = async (e:any)=>{
    e.preventDefault(); setMsg("");
    try{
      const body = { ...contact, ...intent };
      const res = await fetch("/api/investors/intent", { method:"POST", headers:{ "content-type":"application/json" }, body: JSON.stringify(body) });
      const json = await res.json();
      if(!res.ok) throw new Error(json.error||"Failed to save");
      setMsg("Thanks! We have recorded your interest.");
      setIntent({ amount:"", equity:"", expectedROI:"" });
    }catch(err:any){ setMsg(err.message); }
  };

  const ask = async (e:any)=>{
    e.preventDefault(); setA(""); setLoadingQA(true);
    try{
      const res = await fetch("/api/investors/qa", { method:"POST", headers:{ "content-type":"application/json" }, body: JSON.stringify({ question: q }) });
      const json = await res.json();
      if(!res.ok) throw new Error(json.error||"QA failed");
      setA(json.answer);
    }catch(err:any){ setA(`Error: ${err.message}`); }
    finally{ setLoadingQA(false); }
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Your Details</h2>
        <div className="grid grid-cols-1 gap-3">
          <Field label="Full Name" value={contact.name} onChange={(e:any)=>setContact({...contact, name:e.target.value})} placeholder="Jane Doe" required />
          <Field label="Email" type="email" value={contact.email} onChange={(e:any)=>setContact({...contact, email:e.target.value})} placeholder="jane@firm.com" required />
          <Field label="Company" value={contact.company} onChange={(e:any)=>setContact({...contact, company:e.target.value})} placeholder="Fund / Company" />
          <Field label="Phone" value={contact.phone} onChange={(e:any)=>setContact({...contact, phone:e.target.value})} placeholder="+91…" />
        </div>

        <h2 className="text-lg font-semibold mt-6">Investment Interest</h2>
        <form onSubmit={saveIntent} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Field label="Amount (USD)" type="number" step="0.01" value={intent.amount} onChange={(e:any)=>setIntent({...intent, amount:e.target.value})} placeholder="250000" required />
            <Field label="Equity (%)" type="text" value={intent.equity} onChange={(e:any)=>setIntent({...intent, equity:e.target.value})} placeholder="e.g., 5%" />
            <Field label="Expected ROI (3–5y)" type="text" value={intent.expectedROI} onChange={(e:any)=>setIntent({...intent, expectedROI:e.target.value})} placeholder="e.g., 3x in 5y" />
          </div>
          <button className="px-4 py-2 rounded-xl bg-black text-white">Submit Interest</button>
          {msg && <div className="text-sm">{msg}</div>}
        </form>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Questions & Answers</h2>
        <form onSubmit={ask} className="space-y-2">
          <textarea className="w-full min-h-[140px] p-3 border rounded-xl" value={q} onChange={(e:any)=>setQ(e.target.value)} placeholder="Ask about market, traction, economics, roadmap…" required />
          <button disabled={loadingQA} className="px-4 py-2 rounded-xl bg-black text-white">{loadingQA ? "Generating…" : "Get Answer"}</button>
        </form>
        {a && (
          <div className="prose dark:prose-invert max-w-none border rounded-2xl p-3 bg-white/60 dark:bg-zinc-900/60"
               dangerouslySetInnerHTML={{ __html: a.replace(/\n/g, "<br/>") }} />
        )}
      </div>
    </div>
  );
}
