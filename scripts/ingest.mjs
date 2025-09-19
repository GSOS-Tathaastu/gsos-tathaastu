import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { MongoClient } from "mongodb";
import OpenAI from "openai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = process.env.GSOS_DATA_DIR || path.join(__dirname, "../data");
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "gsos";
const model = process.env.EMBEDDING_MODEL || "text-embedding-3-small";

if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY missing");
if (!uri) throw new Error("MONGODB_URI missing");

const openai = new OpenAI();

function readAllTextFiles(dir){
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const f of fs.readdirSync(dir)){
    const p = path.join(dir, f);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) out.push(...readAllTextFiles(p));
    else if (/\.(txt|md|csv|json)$/i.test(f)) out.push({ file: p, text: fs.readFileSync(p, "utf-8") });
  }
  return out;
}

function splitText(text){
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks = [];
  let buf = [];
  for (const s of sentences){
    const len = buf.join(" ").length + s.length;
    if (len > 1200){ chunks.push(buf.join(" ")); buf = []; }
    buf.push(s);
  }
  if (buf.length) chunks.push(buf.join(" "));
  return chunks.filter(c => c.trim().length > 80);
}

async function main(){
  console.log("Reading docs from", DATA_DIR);
  const files = readAllTextFiles(DATA_DIR);
  if (!files.length) { console.log("No files found."); return; }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const col = db.collection("chunks");

  for (const file of files){
    console.log("→", path.basename(file.file));
    const parts = splitText(file.text).slice(0, 2000);
    for (let i=0; i<parts.length; i+=100){
      const batch = parts.slice(i, i+100);
      const emb = await openai.embeddings.create({ model, input: batch });
      const docs = batch.map((text, idx)=>({
        text, source: path.relative(DATA_DIR, file.file), embedding: emb.data[idx].embedding, createdAt: new Date()
      }));
      if (docs.length) await col.insertMany(docs);
      console.log(`   inserted ${i+docs.length}/${parts.length}`);
    }
  }
  await client.close();
  console.log("Done.");
}
main().catch(e=>{ console.error(e); process.exit(1); });
