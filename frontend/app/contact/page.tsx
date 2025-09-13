"use client";
import React, { useState } from "react";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<"idle"|"sending"|"ok"|"err">("idle");

  const set = (k: string, v: string) => setForm(s => ({ ...s, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    const to = process.env.NEXT_PUBLIC_CONTACT_INBOX || "info@tathaastu.global";
    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#111">
        <p><b>Name:</b> ${form.name || "-"}</p>
        <p><b>Email:</b> ${form.email || "-"}</p>
        <p><b>Message:</b><br/>${(form.message || "").replace(/\n/g,"<br/>")}</p>
      </div>`;
    const rsp = await fetch("/api/mail", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ to, subject: "New GSOS website inquiry", html })
    });
    if (rsp.ok) { setStatus("ok"); setForm({ name: "", email: "", message: "" }); }
    else { setStatus("err"); }
  };

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-semibold mb-6">Contact us</h1>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block mb-1">Your Name</label>
          <input className="border rounded px-3 py-2 w-full"
                 value={form.name} onChange={(e)=>set("name", e.target.value)} />
        </div>
        <div>
          <label className="block mb-1">Your Email</label>
          <input type="email" required className="border rounded px-3 py-2 w-full"
                 value={form.email} onChange={(e)=>set("email", e.target.value)} />
        </div>
        <div>
          <label className="block mb-1">Message</label>
          <textarea required className="border rounded px-3 py-2 w-full" rows={5}
                 value={form.message} onChange={(e)=>set("message", e.target.value)} />
        </div>
        <button disabled={status==="sending"} className="bg-indigo-600 text-white px-4 py-2 rounded">
          {status==="sending" ? "Sending..." : "Send"}
        </button>
        {status==="ok" && <p className="text-green-700">Thanks! We’ll get back to you shortly.</p>}
        {status==="err" && <p className="text-red-700">Something went wrong. Please try again.</p>}
      </form>
    </main>
  );
}
