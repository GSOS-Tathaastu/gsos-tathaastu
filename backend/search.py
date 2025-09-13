import os
import json
import time
import hashlib
from typing import List, Tuple, Dict, Any
from loguru import logger
from dotenv import load_dotenv

from docx import Document
from PyPDF2 import PdfReader

# Load env
load_dotenv()

DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "gsos_chunks.json")
DOCS_DIR = os.path.join(os.path.dirname(__file__), "docs")


# -------------------------
# Helpers
# -------------------------
def _split_text(text: str, chunk_size: int = 800, overlap: int = 100) -> List[str]:
    """Split text into overlapping chunks."""
    chunks, start = [], 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start = end - overlap
        if start < 0:
            start = 0
    return chunks


def _load_file(path: str) -> str:
    """Extract text from .docx, .pdf, .txt, .md, .html"""
    ext = os.path.splitext(path)[1].lower()
    text = ""
    try:
        if ext == ".docx":
            doc = Document(path)
            text = "\n".join([p.text for p in doc.paragraphs])
        elif ext == ".pdf":
            reader = PdfReader(path)
            text = "\n".join([page.extract_text() or "" for page in reader.pages])
        elif ext in {".txt", ".md", ".html", ".htm"}:
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                text = f.read()
        else:
            logger.warning(f"Unsupported file type: {ext}")
    except Exception as e:
        logger.error(f"Failed to load {path}: {e}")
    return text


# -------------------------
# Embedding Backends
# -------------------------
def _embed_local(texts: List[str]) -> List[List[float]]:
    """Fallback embedding: deterministic hash vectors."""
    out = []
    for t in texts:
        h = hashlib.sha256(t.encode("utf-8")).digest()
        out.append([b / 255.0 for b in h[:128]])  # 128-dim fake vector
    return out


def _embed_openai(texts: List[str], model: str = "text-embedding-3-small") -> List[List[float]]:
    """Use OpenAI API for embeddings."""
    from openai import OpenAI
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    rsp = client.embeddings.create(model=model, input=texts)
    return [d.embedding for d in rsp.data]


# -------------------------
# Ingestion
# -------------------------
def ingest_docs_to_json(
    only_file: str = None,
    force_openai: bool = False,
    chunk_size: int = 800,
    overlap: int = 100,
    openai_model: str = "text-embedding-3-small",
) -> Dict[str, Any]:
    """Process docs in DOCS_DIR and save embeddings to JSON."""
    os.makedirs(os.path.dirname(DATA_PATH), exist_ok=True)

    # Collect files
    files = []
    for root, _, fnames in os.walk(DOCS_DIR):
        for fn in fnames:
            if only_file and fn != only_file:
                continue
            files.append(os.path.join(root, fn))

    if not files:
        logger.warning("No files found for ingestion.")
        return {"meta": {"created_at": int(time.time()), "count": 0, "embed_backend": "none"}}

    records = []
    for f in files:
        text = _load_file(f)
        if not text.strip():
            continue
        chunks = _split_text(text, chunk_size=chunk_size, overlap=overlap)
        for i, ch in enumerate(chunks):
            records.append({
                "source_path": os.path.basename(f),
                "chunk_index": i,
                "text": ch.strip()
            })

    if not records:
        logger.warning("No chunks created from files.")
        return {"meta": {"created_at": int(time.time()), "count": 0, "embed_backend": "none"}}

    texts = [r["text"] for r in records]
    backend = "local"
    embeddings = []

    try:
        if os.getenv("OPENAI_API_KEY") and (force_openai or not embeddings):
            logger.info(f"Embedding {len(texts)} chunks with OpenAI ({openai_model})...")
            embeddings = _embed_openai(texts, model=openai_model)
            backend = "openai"
    except Exception as e:
        logger.error(f"OpenAI embedding failed, falling back to local. Error: {e}")
        embeddings = _embed_local(texts)

    if not embeddings:
        embeddings = _embed_local(texts)

    for r, e in zip(records, embeddings):
        r["embedding"] = e

    payload = {
        "meta": {
            "created_at": int(time.time()),
            "count": len(records),
            "embed_backend": backend,
            "openai_model": openai_model if backend == "openai" else None,
            "only_file": only_file,
        },
        "records": records,
    }

    with open(DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False)

    logger.info(f"Ingested {len(records)} chunks, backend={backend}")
    return payload


# -------------------------
# Search
# -------------------------
def search_chunks(query: str, top_k: int = 5) -> Tuple[List[Dict], Dict]:
    """Return top_k most similar chunks to query."""
    if not os.path.exists(DATA_PATH):
        return [], {"meta": {"created_at": 0, "count": 0, "embed_backend": "none"}}

    with open(DATA_PATH, "r", encoding="utf-8") as f:
        idx = json.load(f)

    records = idx.get("records", [])
    if not records:
        return [], idx

    # Embed query
    if os.getenv("OPENAI_API_KEY") and idx["meta"].get("embed_backend") == "openai":
        q_emb = _embed_openai([query])[0]
    else:
        q_emb = _embed_local([query])[0]

    # Cosine similarity
    def cos_sim(a, b):
        import numpy as np
        a, b = np.array(a), np.array(b)
        return float(a @ b / ((a**2).sum()**0.5 * (b**2).sum()**0.5 + 1e-8))

    scored = []
    for r in records:
        score = cos_sim(q_emb, r["embedding"])
        scored.append((score, r))

    top = sorted(scored, key=lambda x: x[0], reverse=True)[:top_k]
    return [r for _, r in top], idx
