from fastapi import FastAPI, Depends, Header, HTTPException, Query, Body, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from loguru import logger
from dotenv import load_dotenv
import os, json, shutil, threading, time
from uuid import uuid4
from typing import Optional, Dict, Any

# -------------------------
# Local imports
# -------------------------
from schemas import GenerateQuery, GenerateResponse
from generation import generate_with_openai, _fallback_questions
from search import search_chunks, ingest_docs_to_json

# -------------------------
# Config
# -------------------------
load_dotenv()

API_KEY = os.getenv("BACKEND_API_KEY", "")
ALLOW_ORIGINS = [os.getenv("ALLOW_ORIGIN", "*")]
OPENAI_PRESENT = bool(os.getenv("OPENAI_API_KEY"))

DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "gsos_chunks.json")
DOCS_DIR = os.path.join(os.path.dirname(__file__), "docs")

app = FastAPI(title="GSOS Survey & RAG API", version="1.3.0")

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

# -------------------------
# Health
# -------------------------
@app.get("/health")
def health():
    return {"ok": True}

# -------------------------
# Survey Generation
# -------------------------
@app.get("/generate", response_model=GenerateResponse)
def generate(
    role: str = Query("retailer"),
    count: int = Query(6, ge=1, le=20),
    seed: int | None = None,
    _=Depends(require_key),
):
    q = GenerateQuery(role=role, count=count, seed=seed)
    try:
        if OPENAI_PRESENT:
            questions = generate_with_openai(q)
        else:
            questions = _fallback_questions(q)
    except Exception as e:
        logger.exception(f"OpenAI generation failed; serving fallback. Error: {e}")
        questions = _fallback_questions(q)

    return {"role": q.role, "questions": [qq.model_dump() for qq in questions]}

# -------------------------
# RAG QA
# -------------------------
@app.post("/ask")
def ask(payload: dict = Body(...), _=Depends(require_key)):
    query = (payload.get("query") or "").strip()
    if not query:
        raise HTTPException(status_code=400, detail="query_required")

    top_k = int(payload.get("top_k") or 5)
    results, meta = search_chunks(query, top_k=top_k)

    answer = None
    if OPENAI_PRESENT and results:
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
            logger.exception(f"OpenAI answer failed: {e}")
            answer = None

    return {"ok": True, "meta": meta.get("meta", {}), "results": results, "answer": answer}

# -------------------------
# Admin: List docs
# -------------------------
@app.get("/admin/list-docs")
def list_docs(_=Depends(require_key)):
    out = []
    for root, _, files in os.walk(DOCS_DIR):
        for fn in files:
            path = os.path.join(root, fn)
            rel = os.path.relpath(path, DOCS_DIR)
            try:
                size = os.path.getsize(path)
            except Exception:
                size = -1
            out.append({"path": rel, "size": size})
    return {"ok": True, "docs_dir": DOCS_DIR, "files": out}

# -------------------------
# Admin: Reingest (sync)
# -------------------------
@app.post("/admin/reingest")
def reingest(_=Depends(require_key)):
    payload = ingest_docs_to_json()
    return {"ok": True, "meta": payload["meta"]}

# -------------------------
# Admin: Index meta & download
# -------------------------
@app.get("/admin/index-meta")
def index_meta(_=Depends(require_key)):
    if not os.path.exists(DATA_PATH):
        return {"ok": True, "meta": {"created_at": 0, "count": 0, "embed_backend": "none"}}
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        idx = json.load(f)
    return {"ok": True, "meta": idx.get("meta", {"created_at": 0, "count": 0, "embed_backend": "unknown"})}

@app.get("/admin/download-index")
def download_index(_=Depends(require_key)):
    if not os.path.exists(DATA_PATH):
        return JSONResponse({"ok": False, "error": "index not found"}, status_code=404)
    return FileResponse(DATA_PATH, media_type="application/json", filename="gsos_chunks.json")

# -------------------------
# Admin: Upload + Auto-ingest
# -------------------------
@app.post("/admin/upload")
def admin_upload(file: UploadFile = File(...), _=Depends(require_key)):
    allowed = {".docx", ".pdf", ".md", ".txt", ".html", ".htm"}
    name = file.filename or "uploaded"
    ext = os.path.splitext(name)[1].lower()
    if ext not in allowed:
        raise HTTPException(status_code=400, detail=f"unsupported_extension:{ext}")

    os.makedirs(DOCS_DIR, exist_ok=True)
    dest_path = os.path.join(DOCS_DIR, name)
    with open(dest_path, "wb") as out:
        shutil.copyfileobj(file.file, out)

    payload = ingest_docs_to_json()
    return {"ok": True, "saved": name, "meta": payload["meta"]}

# -------------------------
# Admin: Async Reingest (background jobs)
# -------------------------
JOBS: Dict[str, Dict[str, Any]] = {}

def _run_reingest_job(job_id: str, only_file: Optional[str] = None):
    try:
        JOBS[job_id] = {"status": "running", "started_at": int(time.time()), "meta": {}}
        meta = ingest_docs_to_json(only_file=only_file)  # extend search.py to support only_file
        JOBS[job_id].update({"status": "done", "ended_at": int(time.time()), "meta": meta.get("meta", {})})
    except Exception as e:
        JOBS[job_id].update({"status": "error", "ended_at": int(time.time()), "error": str(e)})

@app.post("/admin/reingest/start")
def reingest_start(file: Optional[str] = Query(None), _=Depends(require_key)):
    job_id = uuid4().hex[:12]
    t = threading.Thread(target=_run_reingest_job, args=(job_id, file), daemon=True)
    t.start()
    return {"ok": True, "job_id": job_id}

@app.get("/admin/reingest/status")
def reingest_status(job_id: str = Query(...), _=Depends(require_key)):
    job = JOBS.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="job_not_found")
    return {"ok": True, "job": job}
