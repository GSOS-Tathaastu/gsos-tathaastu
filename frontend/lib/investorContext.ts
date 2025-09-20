import fs from "fs";
import path from "path";
import { getDbOrNull } from "@/lib/mongo";

export type ContextChunk = { title?: string; text: string };

export async function loadPublicContext(): Promise<{ chunks: ContextChunk[]; source: "local" | "db" }>{
  const mode = (process.env.CHUNK_SOURCE || "local").toLowerCase() as "local" | "db";

  if (mode === "db") {
    const db = await getDbOrNull();
    if (db) {
      const names = (await db.listCollections().toArray()).map((c) => c.name);
      if (names.includes("chunks")) {
        const docs = await db
          .collection("chunks")
          .find({}, { projection: { _id: 0, title: 1, text: 1, content: 1 }, limit: 200 })
          .toArray();

        const chunks = docs
          .map((d: any) => ({
            title: d.title || "",
            text: (d.text || d.content || "").toString(),
          }))
          .filter((c) => c.text?.trim().length > 0);

        if (chunks.length > 0) return { chunks, source: "db" };
      }
    }
    // fall through to local if DB empty
  }

  // LOCAL: read /frontend/data/*.json
  try {
    const dir = path.join(process.cwd(), "data");
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
    let chunks: ContextChunk[] = [];
    for (const f of files) {
      const raw = fs.readFileSync(path.join(dir, f), "utf8");
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        for (const item of arr) {
          const text = (item?.text || item?.content || "").toString();
          if (text.trim()) chunks.push({ title: item?.title || "", text });
        }
      }
    }
    return { chunks, source: "local" };
  } catch {
    return { chunks: [], source: "local" };
  }
}
