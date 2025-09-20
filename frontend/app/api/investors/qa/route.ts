// frontend/app/api/investors/qa/route.ts
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { investorCookie, verifyToken } from "@/lib/auth";
import { chatWithFallback } from "@/lib/ai";

/** ---- helpers: local chunk loading + very simple keyword retrieval ---- */
function loadLocalChunks(): any[] {
  const folder = path.join(process.cwd(), "data");
  if (!fs.existsSync(folder)) return [];
  const files = fs
    .readdirSync(folder)
    .filter((f) => f.toLowerCase().endsWith(".json"));

  const all: any[] = [];
  for (const f of files) {
    try {
      const raw = fs.readFileSync(path.join(folder, f), "utf8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) all.push(...parsed);
      else if (parsed && typeof parsed === "object") all.push(parsed);
    } catch {
      // ignore bad files
    }
  }
  return all;
}

function keywordRetrieve(chunks: any[], q: string, k = 6) {
  const toks = Array.from(
    new Set(
      (q || "")
        .toLowerCase()
        .split(/\s+/)
        .map((t) => t.replace(/[^a-z0-9]/g, ""))
        .filter((t) => t.length > 2)
    )
  );

  const scored = chunks
    .map((c) => {
      const text = (c.text || c.content || "").toLowerCase();
      let score = 0;
      for (const t of toks) if (text.includes(t)) score++;
      return { score, c };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, k).map((x) => x.c);
}

/** ---- route ---- */
export async function POST(req: Request) {
  // 1) Auth via signed cookie (server-side only)
  const cookieHeader = req.headers.get("cookie");
  const cookies = investorCookie.parseCookieHeader(cookieHeader);
  const token = cookies[investorCookie.name];
  const session = verifyToken(token);
  if (!session || session.role !== "investor") {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 200 });
  }

  // 2) OpenAI key check (we’ll still respond gracefully)
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { ok: false, error: "openai_key_missing" },
      { status: 200 }
    );
  }

  // 3) Parse body
  const { question } = await req.json().catch(() => ({}));
  if (!question || typeof question !== "string") {
    return NextResponse.json(
      { ok: false, error: "question required" },
      { status: 200 }
    );
  }

  // 4) Context: load local chunks and do a minimal retrieval
  const chunks = loadLocalChunks();
  const picked = keywordRetrieve(chunks, question, 8);

  const ctx = picked
    .map((c, i) => {
      const title = c.title || c.docId || c.source || "Untitled";
      const txt = (c.text || c.content || "").toString();
      return `CHUNK ${i + 1} (${title}):\n${txt.slice(0, 1600)}`;
    })
    .join("\n\n");

  // 5) Guardrails: no confidential info, cite that we limit answers
  const system =
    "You are an investor-facing assistant for GSOS. " +
    "Answer ONLY using the provided context. If you are not sure, say you don't know. " +
    "Do not reveal or infer confidential information. Keep answers concise and factual.";

  const user =
    `Context:\n${ctx || "(no strong matches)"}\n\n` +
    `Question: ${question}\n\n` +
    `Format:\n- 2–3 bullets with key facts\n- 1 short paragraph (3–4 sentences)\n` +
    `- Final line: "Confidential Information will be shared during in-person meeting."`;

  try {
    const answer = await chatWithFallback(
      [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      { max_tokens: 700, temperature: 0.2 }
    );

    return NextResponse.json({
      ok: true,
      answer,
      retrieved: picked.map((c) => ({
        title: c.title || c.docId || null,
      })),
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "qa_failed" },
      { status: 200 }
    );
  }
}
