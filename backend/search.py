import os, json, time, hashlib
from pathlib import Path
from typing import List, Tuple

from docx import Document
from PyPDF2 import PdfReader

# -------------------------
# Utils
# -------------------------
def _hash_text(text: str) -> str:
    return hashlib.sha1(text.encode("utf-8")).hexdigest()[:10]

def _split_text(text: str, max_tokens: int = 500) -> List[str]:
    """
    Simple splitter: break text into ~500-word chunks.
    You can refine with tiktoken later if needed.
    """
    words = text.split()
    chunks = []
    for i in range(0, len(words), max_tokens):
        chunk = " ".join(words[i : i + max_tokens])
        if chunk.strip():
            chunks.append(chunk.strip())
    return chunks

# -------------------------
# Readers
# -------------------------
def _read_docx(path: str) -> str:
    doc = Document(path)
    return "\n".join(p.text for p in doc.paragraphs if p.text.strip())

def _read_pdf(path: str) -> str:
    pdf = PdfReader(path)
    out = []
    for page in pdf.pages:
        try:
            out.append(page.extract_text() or "")
        except Exception:
            continue
    return "\n".join(out)

def _read_txt(path: str) -> str:
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        return f.read()

# -------------------------
# Embedding backends
# -------------------------
def _embed_local(chunks: List[str]) -> List[List[float]]:
    """
    Very simple local embedding: hash -> pseudo vector.
    Replace later with real model if needed.
    """
    vecs = []
    for ch in chunks:
        h = hashlib.sha256(ch.encode("utf-8")).digest()
        vecs.append([b / 255 for b in h[:64]])  # 64-dim pseudo vector
    return vecs

def _embed_openai(chunks: List[str], model: str) -> List[List[float]]:
    from openai import OpenAI
   client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
rsp = client.embeddings.create(model=model, input=chunks)

    # OpenAI supports batching
    rsp = client.embeddings.create(model=model, input=chunks)
    return [d.embedding for d in rsp.data]

# -------------------------
# Main ingest
# -------------------------
def ingest_docs_to_json(only_file: str | None = None, force_openai: bool = False):
    """
    Read docs/, split into chunks, embed with local or OpenAI, save JSON index.
    """
    docs_dir = Path(__file__).parent / "docs"
    data_dir = Path(__file__).parent / "data"
    data_dir.mkdir(exist_ok=True)
    out_path = data_dir / "gsos_chunks.json"

    files = []
    for fn in os.listdir(docs_dir):
        if only_file and fn != only_file:
            continue
        if fn.lower().endswith((".docx", ".pdf", ".txt", ".md", ".html", ".htm")):
            files.append(fn)

    records = []
    for fn in files:
        path = docs_dir / fn
        ext = path.suffix.lower()
        if ext == ".docx":
            text = _read_docx(path)
        elif ext == ".pdf":
            text = _read_pdf(path)
        else:
            text = _read_txt(path)

        for i, chunk in enumerate(_split_text(text)):
            records.append({
                "id": f"{fn}#{i}",
                "source_path": fn,
                "chunk_index": i,
                "text": chunk,
            })

    # Decide backend
    backend = os.getenv("EMBED_BACKEND", "local")
    if force_openai:
        backend = "openai"

    openai_model = None
    embeddings = []

    if backend == "openai":
        openai_model = os.getenv("OPENAI_EMBED_MODEL", "text-embedding-3-small")
        texts = [r["text"] for r in records]
        if texts:
            embeddings = _embed_openai(texts, model=openai_model)
    else:
        texts = [r["text"] for r in records]
        if texts:
            embeddings = _embed_local(texts)

    # Attach embeddings
    for rec, emb in zip(records, embeddings):
        rec["embedding"] = emb

    payload = {
        "meta": {
            "created_at": int(time.time()),
            "count": len(records),
            "embed_backend": backend,
            "openai_model": openai_model,
            "only_file": only_file,
        },
        "records": records,
    }

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False)

    return payload

# -------------------------
# Search
# -------------------------
def _cosine(a: List[float], b: List[float]) -> float:
    import math
    dot = sum(x*y for x, y in zip(a, b))
    na = math.sqrt(sum(x*x for x in a))
    nb = math.sqrt(sum(y*y for y in b))
    return dot / (na * nb + 1e-9)

def search_chunks(query: str, top_k: int = 5) -> Tuple[List[dict], dict]:
    data_path = Path(__file__).parent / "data" / "gsos_chunks.json"
    if not data_path.exists():
        return [], {"meta": {"created_at": 0, "count": 0, "embed_backend": "none"}}

    with open(data_path, "r", encoding="utf-8") as f:
        idx = json.load(f)

    records = idx.get("records", [])
    backend = idx.get("meta", {}).get("embed_backend", "local")

    # Embed query
    if backend == "openai":
        openai_model = idx["meta"].get("openai_model", "text-embedding-3-small")
        q_emb = _embed_openai([query], model=openai_model)[0]
    else:
        q_emb = _embed_local([query])[0]

    # Score
    scored = [(rec, _cosine(q_emb, rec["embedding"])) for rec in records]
    scored.sort(key=lambda x: x[1], reverse=True)
    out = []
    for rec, score in scored[:top_k]:
        r = rec.copy()
        r["score"] = float(score)
        out.append(r)

    return out, idx
