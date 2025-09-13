# backend/search.py
import os, json, time, math
from pathlib import Path
from typing import List, Tuple, Dict, Any, Optional

from text_utils import read_text_any, chunk_text

# ---- Config via env ----
EMBED_BACKEND       = os.getenv("EMBED_BACKEND", "openai").lower()  # "openai" | "local"
OPENAI_EMBED_MODEL  = os.getenv("OPENAI_EMBED_MODEL", "text-embedding-3-small")
EMBED_BATCH_SIZE    = int(os.getenv("EMBED_BATCH_SIZE", "32"))

BASE_DIR   = Path(__file__).parent
DOCS_DIR   = BASE_DIR / "docs"
DATA_DIR   = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
INDEX_PATH = DATA_DIR / "gsos_chunks.json"

# ---- Embedding helpers ----
def _embed_texts_openai(texts: List[str]) -> List[List[float]]:
    from openai import OpenAI
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    out: List[List[float]] = []
    for i in range(0, len(texts), EMBED_BATCH_SIZE):
        batch = texts[i:i+EMBED_BATCH_SIZE]
        resp = client.embeddings.create(model=OPENAI_EMBED_MODEL, input=batch)
        out.extend([d.embedding for d in resp.data])
    return out

def _embed_texts_local(texts: List[str]) -> List[List[float]]:
    # super-simple bag-of-chars embedding (deterministic)
    # good enough for basic recall until openai is enabled
    import hashlib
    V = 256
    vecs: List[List[float]] = []
    for t in texts:
        v = [0.0] * V
        for ch in t:
            v[ord(ch) % V] += 1.0
        # L2 norm
        norm = math.sqrt(sum(x*x for x in v)) or 1.0
        vecs.append([x / norm for x in v])
    return vecs

def _embed_texts(texts: List[str]) -> List[List[float]]:
    if not texts:
        return []
    if EMBED_BACKEND == "openai":
        return _embed_texts_openai(texts)
    return _embed_texts_local(texts)

# ---- Index I/O ----
def _load_index() -> Dict[str, Any]:
    if INDEX_PATH.exists():
        with open(INDEX_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"meta": {"created_at": 0, "count": 0, "embed_backend": EMBED_BACKEND}, "records": []}

def _save_index(idx: Dict[str, Any]) -> None:
    with open(INDEX_PATH, "w", encoding="utf-8") as f:
        json.dump(idx, f, ensure_ascii=False)

# ---- Ingestion ----
def ingest_docs_to_json(only_file: Optional[str] = None) -> Dict[str, Any]:
    """
    Read supported files under backend/docs, chunk, embed, and save to data/gsos_chunks.json
    If only_file is provided, only (re)ingest that one; otherwise rebuild from all docs.
    """
    allowed = {".pdf", ".md", ".txt", ".html", ".htm", ".docx"}

    files: List[Path] = []
    for p in DOCS_DIR.rglob("*"):
        if p.is_file() and p.suffix.lower() in allowed:
            if only_file and p.name != only_file:
                continue
            files.append(p)

    # If only_file is set but not found, keep existing index and report 0 delta
    if only_file and not files:
        idx = _load_index()
        idx["meta"].update({
            "created_at": int(time.time()),
            "count": len(idx.get("records", [])),
            "embed_backend": EMBED_BACKEND,
            "note": f"only_file '{only_file}' not found",
        })
        _save_index(idx)
        return idx

    # Build records
    records: List[Dict[str, Any]] = []
    for fp in files:
        text = read_text_any(str(fp))
        if not text:
            continue
        chunks = chunk_text(text)
        for i, ch in enumerate(chunks):
            records.append({
                "source_path": fp.name,
                "chunk_index": i,
                "text": ch,
            })

    # If only_file: we need to *merge* with existing records from other files
    if only_file:
        old = _load_index()
        keep: List[Dict[str, Any]] = []
        for r in old.get("records", []):
            # keep everything NOT from only_file (we'll replace that subset)
            if r.get("source_path") != only_file:
                keep.append(r)
        base_records = keep + records
    else:
        base_records = records

    # Embed in the same order
    embeddings = _embed_texts([r["text"] for r in base_records]) if base_records else []

    # Write index
    idx = {
        "meta": {
            "created_at": int(time.time()),
            "count": len(base_records),
            "embed_backend": EMBED_BACKEND,
            "openai_model": OPENAI_EMBED_MODEL if EMBED_BACKEND == "openai" else None,
            "only_file": only_file or None,
        },
        "records": [
            {**r, "embedding": embeddings[i]} for i, r in enumerate(base_records)
        ],
    }
    _save_index(idx)
    return idx

# ---- Search ----
def _cosine(a: List[float], b: List[float]) -> float:
    s = sum(x*y for x, y in zip(a, b))
    na = math.sqrt(sum(x*x for x in a)) or 1.0
    nb = math.sqrt(sum(y*y for y in b)) or 1.0
    return s / (na * nb)

def search_chunks(query: str, top_k: int = 5) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    idx = _load_index()
    recs = idx.get("records", [])
    if not recs:
        return [], idx

    q_emb = _embed_texts([query])[0]
    scored = []
    for r in recs:
        score = _cosine(q_emb, r["embedding"])
        scored.append((score, r))
    scored.sort(key=lambda x: x[0], reverse=True)
    results = []
    for score, r in scored[:max(1, top_k)]:
        out = dict(r)
        out["score"] = round(float(score), 6)
        results.append(out)
    return results, idx
