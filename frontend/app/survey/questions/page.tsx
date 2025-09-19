// frontend/app/survey/questions/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Session = {
  id: string;
  createdAt: number;
  profile: {
    companyName: string;
    rolePrimary?: string;
    roleSecondary?: string;
    country?: string;
    preferredCurrency?: string;
  };
};

export default function SurveyQuestionsPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState<string>("");

  async function ensureSession(): Promise<Session> {
    // 1) try GET
    const g = await fetch("/api/survey/start", { cache: "no-store" });
    if (g.ok) {
      const j = await g.json();
      return j.session as Session;
    }

    // 2) build POST payload from Step-0 (if any) or fallback
    let profile: Session["profile"] = {
      companyName: "Guest",
      rolePrimary: "other",
    };

    try {
      const ob = sessionStorage.getItem("onboarding");
      if (ob) {
        const parsed = JSON.parse(ob);
        profile = {
          companyName: parsed.companyName || parsed.company || "Guest",
          rolePrimary: parsed.rolePrimary || parsed.role || "other",
          roleSecondary: parsed.roleSecondary,
          country: parsed.country,
          preferredCurrency: parsed.preferredCurrency,
        };
      }
    } catch {
      // ignore parse errors -> fallback profile stays
    }

    // 3) POST to create session cookie
    const p = await fetch("/api/survey/start", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ profile }),
    });

    if (!p.ok) {
      const jj = await p.json().catch(() => ({}));
      throw new Error(jj.error || `start ${p.status}`);
    }
    const j = await p.json();
    return j.session as Session;
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const s = await ensureSession();
        if (!alive) return;
        setSession(s);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || "start_failed");
      }
    })();
    return () => { alive = false; };
  }, []);

  if (error && !session) {
    return (
      <div className="p-6">
        <div className="text-red-600">Error: {error}</div>
        <div className="mt-3">
          <Link className="underline" href="/step-zero">Go to Step-0</Link>
        </div>
      </div>
    );
  }

  if (!session) return <div className="p-6">Loading…</div>;

  // … render your questions + submit button here …
  return (
    <div className="p-6 space-y-4">
      <div className="rounded-xl p-3 bg-zinc-800 text-white">
        <div className="text-xs opacity-80">Your profile (from Step-0)</div>
        <div className="font-semibold">
          {session.profile.companyName} • {session.profile.rolePrimary || "—"}
          {session.profile.country ? ` • ${session.profile.country}` : ""}
          {session.profile.preferredCurrency ? ` • ${session.profile.preferredCurrency}` : ""}
        </div>
      </div>

      {/* TODO: your generated questions UI and a real submit button */}
      <button className="px-4 py-2 rounded-xl bg-black text-white">Submit responses</button>
    </div>
  );
}
