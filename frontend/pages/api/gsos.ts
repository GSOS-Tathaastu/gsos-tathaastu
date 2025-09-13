// frontend/pages/api/gsos.ts
import type { NextApiRequest, NextApiResponse } from "next";

const BASE = process.env.API_BASE!;           // e.g. Railway backend URL
const KEY  = process.env.BACKEND_API_KEY!;    // your API key (kept server-side)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Example call: /api/gsos?path=generate&role=retailer&count=6
    const path = (req.query.path as string) || "";
    if (!path) {
      res.status(400).json({ ok: false, error: "Missing path query parameter" });
      return;
    }

    // Construct backend URL with querystring if present
    const queryString = req.url?.includes("?") ? req.url.split("?")[1] : "";
    const url = `${BASE}/${path}${queryString ? "?" + queryString : ""}`;

    // Forward request to Railway backend
    const upstream = await fetch(url, {
      method: req.method,
      headers: {
        "x-api-key": KEY,
        "content-type": req.headers["content-type"] || "application/json",
      },
      body: ["POST","PUT","PATCH"].includes(req.method || "")
        ? JSON.stringify(req.body || {})
        : undefined,
    });

    const text = await upstream.text();
    res.status(upstream.status).send(text);
  } catch (e: any) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}
