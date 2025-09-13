import os, json, time, math, hashlib
from typing import List, Dict, Any, Tuple
from text_utils import read_text_any, chunk_text

DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "gsos_chunks.json")
DOCS_DIR  = os.path.join(os.path.dirname(__file__), "docs")

# Controls: set EMBED_BACKEND=local in Railway to force local embeddings
EMBED_BACKEND = (os.getenv("EMBED_BACKEND") or "").lower().strip() or "auto"
MAX_CHARS_PER_CHUNK = int(os.getenv("MAX_CHARS_PER_CHUNK") or "1200")
BATCH_SIZE = int(os.getenv("EMBED_BATCH_SIZE") or "64")

def _has_openai() -> bool:
    return bool(os.getenv("OPENAI_API_KEY"))

def _prepare_texts(texts: List[str]) -> List[str]:
    return [(t if len(t) <= MAX_CHARS_PER_CHUNK else t[:MAX_CHARS_PER_CHUNK]) for t in texts]

def _embed_local(texts: List[str]) -> List[List[float]]:
    dim = 256
    vecs: List[List[float]] = []
    for t in texts:
        v = [0.0]*dim
        for token in t.lower().split():
            h = int(hashlib.sha1(token.encode()).hexdigest(), 16)
            v[h % dim] += 1.0
        norm = math.sqrt(sum(x*x for x in v)) or 1.0
        vecs.append([x/norm for x in v])
    return vecs

def _embed_openai_batched(texts: List[str]) -> List[List[float]]:
    from openai import OpenAI
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    model = os.getenv("OPENAI_EMBED_MODEL", "text-embedding-3-small")
    out: List[List[float]] = []
    for i in range(0, len(texts), BATCH_SIZE):
        batch = texts[i:i+BATCH_SIZE]
        try:
            rsp = client.embeddings.create(model=model, input=batch)
            out.extend([d.embedding for d in rsp.data])
        except Exception:
            # If a batch fails, fall back to local for that batch so ingest never hard fails
            out.extend(_embed_local(batch))
    return out

def _embed_texts(texts: List[str]) -> List[List[float]]:
    texts = _prepare_texts(texts)
    if EMBED_BACKEND == "local":
        return _embed_local(texts)
    if EMBED_BACKEND == "openai":
        return _embed_openai_batched(texts)
    # auto
    if _has_openai():
        try:
            return _embed_openai_batched(texts)
        except Exception:
            return _embed_local(texts)
    return _embed_local(texts)

def _cosine(a: List[float], b: List[float]) -> float:
    return sum(x*y for x,y in zip(a,b)) / (
        (math.sqrt(sum(x*x for x in a)) or 1.0) * (math.sqrt(sum(y*y for y in b)) or 1.0)
    )

def ingest_docs_to_json() -> Dict[str, Any]:
    records: List[Dict[str, Any]] = []
    for root, _, files in os.walk(DOCS_DIR):
        for fn in files:
            ext = os.path.splitext(fn)[1].lower()
            if ext not in [".pdf", ".md", ".txt", ".html", ".htm", ".docx"]:
                continue
            path = os.path.join(root, fn)
            text = read_text_any(path)
            chunks = chunk_text(text)
            for i, ch in enumerate(chunks):
                records.append({
                    "id": f"{fn}:{i}",
                    "source_path": os.path.relpath(path, DOCS_DIR),
                    "chunk_index": i,
                    "text": ch
                })

    embeddings = _embed_texts([r["text"] for r in records]) if records else []
    for r, e in zip(records, embeddings):
        r["embedding"] = e

    payload = {
        "meta": {
            "created_at": int(time.time()),
            "count": len(records),
            "embed_backend": ("openai" if _has_openai() and EMBED_BACKEND != "local" else "local") if records else "none"
        },
        "chunks": records
    }
    os.makedirs(os.path.dirname(DATA_PATH), exist_ok=True)
    with open(DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False)
    return payload

def _load_index() -> Dict[str, Any]:
    if not os.path.exists(DATA_PATH):
        return {"meta": {"created_at": 0, "count": 0, "embed_backend": "none"}, "chunks": []}
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def search_chunks(query: str, top_k: int = 5) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    idx = _load_index()
    chunks = idx.get("chunks", [])
    if not chunks:
        return [], idx

    q_vec = _embed_texts([query])[0]
    scored = [( _cosine(q_vec, c["embedding"]), c) for c in chunks if "embedding" in c]

    scored.sort(key=lambda x: x[0], reverse=True)
    out = []
    for s, c in scored[:top_k]:
        item = {k: v for k, v in c.items() if k != "embedding"}
        item["score"] = round(float(s), 4)
        out.append(item)
    return out, idx
