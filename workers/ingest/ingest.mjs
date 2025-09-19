import "dotenv/config";
console.log("DEBUG ENV OPENAI_API_KEY:", process.env.OPENAI_API_KEY?.slice(0, 15));
console.log("DEBUG ENV PROJECT_ID:", process.env.OPENAI_PROJECT_ID);
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createHash } from "crypto";
import { MongoClient } from "mongodb";
import OpenAI from "openai";
import mammoth from "mammoth";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// DATA SOURCE
const DATA_DIR = process.env.GSOS_DATA_DIR || path.join(__dirname, "data");

// DB + MODELS
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "gsos";
const model = process.env.EMBEDDING_MODEL || "text-embedding-3-small";

// Prefer project-specific var to avoid global conflicts
const apiKey = process.env.GSOS_OPENAI_API_KEY || process.env.OPENAI_API_KEY || "";
if (!apiKey) throw new Error("OPENAI_API_KEY missing (set GSOS_OPENAI_API_KEY in .env)");

const openai = new OpenAI({
  apiKey,
  ...(process.env.OPENAI_PROJECT_ID ? { project: process.env.OPENAI_PROJECT_ID } : {}),
  ...(process.env.OPENAI_ORG_ID ? { organization: process.env.OPENAI_ORG_ID } : {}),
});

// Walk all files under a directory (returns absolute paths)
function walkFiles(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) out.push(...walkFiles(p));
    else out.push(p);
  }
  return out;
}

// Load a single file to TEXT (supports .txt, .md, .csv, .json, .docx)
async function loadFileText(p) {
  const ext = path.extname(p).toLowerCase();
  if (ext === ".docx") {
    const buffer = fs.readFileSync(p);
    const { value } = await mammoth.extractRawText({ buffer });
    return (value || "").trim();
  }
  if ([".txt", ".md", ".csv", ".json"].includes(ext)) {
    return fs.readFileSync(p, "utf-8").trim();
  }
  return ""; // skip unsupported types
}

function splitText(text) {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks = [];
  let buf = [];
  for (const s of sentences) {
    const len = buf.join(" ").length + s.length;
    if (len > 1200) {
      if (buf.length) chunks.push(buf.join(" "));
      buf = [];
    }
    buf.push(s);
  }
  if (buf.length) chunks.push(buf.join(" "));
  // Skip tiny crumbs
  return chunks.filter((c) => c.trim().length > 80);
}

function sha(text) {
  return createHash("sha256").update(text).digest("hex");
}

async function main() {
  console.log("[ingest] reading from:", DATA_DIR);

  const paths = walkFiles(DATA_DIR);
  const files = [];
  for (const p of paths) {
    const text = await loadFileText(p);
    if (text) files.push({ file: p, text });
  }
  if (!files.length) {
    console.log("[ingest] no usable files found");
    return;
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const col = db.collection("chunks");

  // idempotency: ensure unique hash
  await col.createIndex({ hash: 1 }, { unique: true }).catch(() => {});

  let total = 0;
  let inserted = 0;

  for (const file of files) {
    console.log("→", path.basename(file.file));
    const parts = splitText(file.text).slice(0, 2000);
    total += parts.length;

    for (let i = 0; i < parts.length; i += 100) {
      const batch = parts.slice(i, i + 100);
      if (!batch.length) continue;

      const emb = await openai.embeddings.create({ model, input: batch });
      const docs = batch.map((text, idx) => ({
        text,
        source: path.relative(DATA_DIR, file.file),
        hash: sha(text),
        embedding: emb.data[idx].embedding,
        createdAt: new Date(),
      }));

      // upsert to avoid duplicates
      for (const d of docs) {
        try {
          await col.updateOne({ hash: d.hash }, { $setOnInsert: d }, { upsert: true });
          inserted += 1;
        } catch {
          // duplicate -> ignore
        }
      }
      console.log(`   processed ${Math.min(i + batch.length, parts.length)}/${parts.length}`);
    }
  }

  await client.close();
  console.log(`[ingest] done. files=${files.length} chunks=${total} inserted=${inserted}`);
}

main().catch((e) => {
  console.error("[ingest] error:", e);
  process.exit(1);
});
