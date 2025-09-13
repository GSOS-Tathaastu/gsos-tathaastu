from fastapi import FastAPI, Depends, Header, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
from dotenv import load_dotenv
import os

from schemas import GenerateQuery, GenerateResponse
from generation import generate_with_openai, _fallback_questions

# RAG imports
from search import search_chunks, ingest_docs_to_json

load_dotenv()

API_KEY = os.getenv("BACKEND_API_KEY", "")
ALLOW_ORIGINS = [os.getenv("ALLOW_ORIGIN", "*")]

app = FastAPI(title="GSOS Survey & RAG API", version="1.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOW_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def require_key(x_api_key: str = Header(default="")):
    if API_KEY and x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return True


@app.get("/health")
def health():
    return {"ok": True}


@app.get("/generate", response_model=GenerateResponse)
def generate(
    role: str = Query("retailer"),
    count: int = Query(6, ge=1, le=20),
    seed: int | None = None,
    _=Depends(require_key),
):
    """
    Generate a role-aware readiness survey grounded in GSOS chunks (if OPENAI_API_KEY is set),
    else fall back to curated local questions.
    """
    q = GenerateQuery(role=role, count=count, seed=seed)
    if os.getenv("OPENAI_API_KEY"):
        questions = generate_with_openai(q)
    else:
        questions = _fallback_questions(q)

    logger.info(f"Generated {len(questions)} questions for role={role}")
    return {"role": q.role, "questions": [qq.model_dump() for qq in questions]}


# -----------------------------
# RAG Endpoints
# -----------------------------

@app.post("/ask")
def ask(payload: dict = Body(...), _=Depends(require_key)):
    """
    Body: { "query": str, "top_k": int=5 }
    Returns: top chunks and (if OPENAI_API_KEY) a short answer grounded strictly in context.
    """
    query = (payload.get("query") or "").strip()
    if not query:
        raise HTTPException(status_code=400, detail="query_required")

    top_k = int(payload.get("top_k") or 5)
    results, meta = search_chunks(query, top_k=top_k)

    answer = None
    if os.getenv("OPENAI_API_KEY") and results:
        try:
            from openai import OpenAI
            client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
            ctx = "\n\n".join(
                [f"[{r['source_path']}#{r['chunk_index']}] {r['text']}" for r in results]
            )
            prompt = (
                "Answer the question using only the provided context.\n\n"
                f"Question: {query}\n\nContext:\n{ctx}\n\nAnswer:"
            )
            rsp = client.chat.completions.create(
                model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
                temperature=0.2,
                messages=[
                    {"role": "system", "content": "You answer strictly from the given context."},
                    {"role": "user", "content": prompt},
                ],
            )
            answer = rsp.choices[0].message.content
        except Exception as e:
            logger.exception(e)
            answer = None

    return {"ok": True, "meta": meta.get("meta", {}), "results": results, "answer": answer}


@app.post("/admin/reingest")
def reingest(_=Depends(require_key)):
    """
    Re-chunk all files in backend/docs into backend/data/gsos_chunks.json
    Supports: .pdf .md .txt .html
    """
    payload = ingest_docs_to_json()
    return {"ok": True, "meta": payload["meta"]}