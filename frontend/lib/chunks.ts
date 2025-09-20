// frontend/lib/chunks.ts
import type { Db } from "mongodb";
import fs from "node:fs";
import path from "node:path";
import { readSettings } from "@/lib/settings";

export type Chunk = {
  id: string;
  title?: string;
  text: string;
  tags?: string[];
};

let cachedLocal: { when: number; chunks: Chunk[] } | null = null;

function toChunk(raw: any, i: number, src: string): Chunk {
  const id = String(raw?.id ?? `local-${src}-${i}`);
  const text = String(raw?.text ?? "").trim();
  const title = raw?.title ? String(raw.title) : undefined;

  let tags: string[] | undefined;
  if (Array.isArray(raw?.tags)) {
    tags = raw.tags.map(String);
  } else if (typeof raw?.tags === "string") {
    tags = raw.tags
      .split(/[|,]/)
      .map((s: string) => s.trim())
      .filter(Boolean);
  } else {
    tags = [];
  }

  if (!text) throw new Error(`Chunk ${id} from ${src} is missing 'text'`);
  return { id, title, text, tags };
}

async function loadFromDb(db: Db): Promise<Chunk[]> {
  const rows = await db
    .collection("chunks")
    .find({}, { projection: { _id: 0, id: 1, title: 1, text: 1, tags: 1 } })
    .toArray();
  return rows.map((r: any, i: number) => toChunk(r, i, "db"));
}

function loadFromDataDir(): Chunk[] {
  if (cachedLocal && Date.now() - cachedLocal.when < 15_000) {
    return cachedLocal.chunks;
  }
  const candidates = [
    path.join(process.cwd(), "data"),
    path.join(process.cwd(), "frontend", "data"),
    path.join(__dirname, "..", "data"),
    path.join(__dirname, "..", "..", "data"),
  ];
  let dir = "";
  for (const p of candidates) {
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) {
      dir = p; break;
    }
  }
  if (!dir) return [];

  const files = fs.readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith(".json"))
    .sort();

  const merged: Chunk[] = [];
  const seen = new Set<string>();

  for (const file of files) {
    const full = path.join(dir, file);
    try {
      const raw = fs.readFileSync(full, "utf8");
      const obj = JSON.parse(raw);
      const arr = Array.isArray(obj) ? obj : obj?.chunks;
      if (!Array.isArray(arr)) continue;

      arr.forEach((row: any, i: number) => {
        try {
          const c = toChunk(row, i, file);
          if (!seen.has(c.id)) {
            seen.add(c.id);
            merged.push(c);
          }
        } catch {
          /* skip bad row */
        }
      });
    } catch {
      /* skip bad file */
    }
  }
  cachedLocal = { when: Date.now(), chunks: merged };
  return merged;
}

/** DB first (unless toggle forces local), otherwise local /data/*.json */
export async function getChunks(dbOrNull: Db | null): Promise<{
  source: "db" | "local";
  chunks: Chunk[];
}> {
  // Read the setting if possible
  const forceLocal = dbOrNull ? (await readSettings(dbOrNull)).forceLocalChunks === true : false;

  if (!forceLocal && dbOrNull) {
    try {
      const fromDb = await loadFromDb(dbOrNull);
      if (fromDb.length) return { source: "db", chunks: fromDb };
    } catch {
      // ignore and fall through
    }
  }
  return { source: "local", chunks: loadFromDataDir() };
}
