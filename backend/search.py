import os, json, time
from typing import List, Tuple, Dict
from loguru import logger

# -------------------------
# Config via ENV
# -------------------------
OPENAI_EMBED_MODEL   = os.getenv("OPENAI_EMBED_MODEL", "text-embedding-3-small")
ITEM_TOKEN_CAP       = int(os.getenv("EMBED_ITEM_TOKEN_CAP", "8000"))
REQ_TOKEN_BUDGET     = int(os.getenv("EMBED_REQ_TOKEN_BUDGET", "200000"))

DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "gsos_chunks.json")
DOCS_DIR  = os.path.join(os.path.dirname(__file__), "docs")

# -------------------------
# Simple text splitter
# -------------------------
CHUNK_SIZE    = int(os.getenv("CHUNK_SIZE", "700"))
CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "150"))

def _split_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> List[str]:
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        chunks.append(chunk)
        start += chunk_size - overlap
    return chunks

# -------------------------
# Embedding helpers
# -------------------------
def _estimate_tokens_by_chars(text: str) -> int:
    return max(1, len(text) // 4)

def _truncate_to_tokens_approx(text: str, max_tokens: int) -> str:
    limit = max_tokens * 4
    return text if len(text) <= limit else text[:limit]

def _embed_openai(
    texts: List[str],
    model: str = OPENAI_EMBED_MODEL,
    per_item_token_cap: int = ITEM_TOKEN_CAP,
    max_tokens_per_request: int = REQ_TOKEN_BUDGET,
) -> List[List[float]]:
    """
    Batched embeddings with per-item truncation and request-level token budget.
    """
    from openai import OpenAI
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    # 1. truncate
    safe_texts = [_truncate_to_tokens_approx(t, per_item_token_cap) for t in texts]

    # 2. batch
    batches, current_batch, current_tokens = [], [], 0
    for t in safe_texts:
        t_tokens = _estimate_tokens_by_chars(t)
        if current_batch and (current_tokens + t_tokens) > max_tokens_per_request:
            batches.append(current_batch)
            current_batch, current_tokens = [t], t_tokens
        else:
            current_batch.append(t)
            current_tokens += t_tokens
    if current_batch:
        batches.append(current_batch)

    # 3. call API
    out: List[List[float]] = []
    for i, batch in enumerate(batches, 1):
        logger.info(f"Embedding batch {i}/{len(batches)} with {len(batch)} items")
        rsp = client.embeddings.create(model=model, input=batch)
        out.extend([d.embedding for d in rsp.data])
    return out

def _embed_local(texts: List[str]) -> List[List[float]]:
    import hashlib
    return [[(int(hashlib.sha256(t.encode()).hexdigest(), 16) % 1000) / 1000.0 for _ in range(10)] for t in texts]

def _embed_texts(texts: List[str], force_openai: bool = False) -> Tuple[List[List[float]], str]:
    if os.getenv("OPENAI_API_KEY") and (force_openai or os.getenv("FORCE_OPENAI") == "true"):
        try:
            return _embed_openai(texts), "openai"
        except Exception as e:
            logger.error(f"OpenAI embedding failed, falling back. Error: {e}")
            return _embed_local(texts), "local"
    return _embed_local(texts), "local"

# -------------------------
# Ingest pipeline
# -------------------------
def ingest_docs_to_json(only_file: str = None, force_openai: bool = False) -> Dict:
    import docx, datetime

    records = []
    for fn in os.listdir(DOCS_DIR):
        if only_file and fn != only_file:
            continue
        path = os.path.join(DOCS_DIR, fn)
        if fn.lower().endswith(".docx"):
            doc = docx.Document(path)
            text = "\n".join(p.text for p in doc.paragraphs if p.text.strip())
        elif fn.lower().endswith(".txt"):
            with open(path, "r", encoding="utf-8") as f:
                text = f.read()
        else:
            continue
        chunks = _split_text(text)
        for i, ch in enumerate(chunks):
            records.append({"source_path": fn, "chunk_index": i, "text": ch})

    texts = [r["text"] for r in records]
    embeddings, backend = _embed_texts(texts, force_openai=force_openai)

    for r, emb in zip(records, embeddings):
        r["embedding"] = emb

    payload = {
        "meta": {
            "created_at": int(time.time()),
            "count": len(records),
            "embed_backend": backend,
            "openai_model": OPENAI_EMBED_MODEL if backend == "openai" else None,
            "only_file": only_file,
        },
        "records": records,
    }
    os.makedirs(os.path.dirname(DATA_PATH), exist_ok=True)
    with open(DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    logger.info(f"Ingested {len(records)} chunks, backend={backend}")
    return payload

# -------------------------
# Search
# -------------------------
def search_chunks(query: str, top_k: int = 5) -> Tuple[List[Dict], Dict]:
    """
    Return top_k most similar chunks to query, embedding the query with
    the SAME backend as the stored index (OpenAI vs local).
    """
    if not os.path.exists(DATA_PATH):
        return [], {"meta": {"created_at": 0, "count": 0, "embed_backend": "none"}}

    with open(DATA_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    records = data.get("records", [])
    meta = data.get("meta", {})
    if not records:
        return [], data

    # Choose query embedding backend to match the index
    idx_backend = meta.get("embed_backend", "local")
    if idx_backend == "openai":
        q_emb = _embed_openai([query], model=meta.get("openai_model", OPENAI_EMBED_MODEL))[0]
    else:
        q_emb = _embed_local([query])[0]

    # Cosine similarity (using numpy)
    from numpy import dot
    from numpy.linalg import norm

    def cos(a, b):
        return float(dot(a, b) / (norm(a) * norm(b) + 1e-8))

    scored = []
    for r in records:
        emb = r.get("embedding")
        # Skip any malformed rows
        if not isinstance(emb, list):
            continue
        if len(emb) != len(q_emb):
            # If you ever had a mixed index (old + new), skip mismatched dims
            continue
        scored.append((cos(q_emb, emb), r))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [r for _, r in scored[:top_k]], data
