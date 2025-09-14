from fastapi import FastAPI, Depends, Header, HTTPException, Query, Body, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from loguru import logger
from dotenv import load_dotenv
from typing import Optional, List, Dict, Any
import os, json, shutil, time

# -------------------------
# Load env
# -------------------------
load_dotenv()
API_KEY       = os.getenv("BACKEND_API_KEY", "")
ALLOW_ORIGINS = [os.getenv("ALLOW_ORIGIN", "*")]
OPENAI_PRESENT = bool(os.getenv("OPENAI_API_KEY"))

BASE_DIR  = os.path.dirname(__file__)
DATA_PATH = os.path.join(BASE_DIR, "data", "gsos_chunks.json")
DOCS_DIR  = os.path.join(BASE_DIR, "docs")

# -------------------------
# Local modules
# -------------------------
from schemas import GenerateQuery, GenerateResponse
from generation import generate_with_openai, _fallback_questions
from search import search_chunks, ingest_docs_to_json

# -------------------------
# App
# -------------------------
app = FastAPI(title="GSOS Survey & RAG API", version="1.4.0")
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
def generate(role: str = Query("retailer"), count: int = Query(12, ge=10, le=15), seed: Optional[int] = None, _=Depends(require_key)):
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
# RAG Ask
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
            ctx = "\n\n".join([f"[{r['source_path']}#{r['chunk_index']}] {r['text']}" for r in results])
            prompt = f"Answer the question using only the provided context.\n\nQuestion: {query}\n\nContext:\n{ctx}\n\nAnswer:"
            rsp = client.chat.completions.create(
                model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
                temperature=0.2,
                messages=[
                    {"role": "system", "content": "Answer strictly from the given context."},
                    {"role": "user", "content": prompt},
                ],
            )
            answer = rsp.choices[0].message.content
        except Exception as e:
            logger.exception(f"OpenAI answer failed: {e}")
            answer = None

    return {"ok": True, "meta": meta.get("meta", {}), "results": results, "answer": answer}

# -------------------------
# Analyze (post-survey)
# -------------------------
@app.post("/analyze")
def analyze(payload: dict = Body(...), _=Depends(require_key)):
    role = (payload.get("role") or "retailer").strip()
    answers = payload.get("answers") or []

    # Build a readable profile, including short_text
    profile_lines = []
    for a in answers:
        t = (a.get("type") or "").lower()
        if t == "mcq":
            vals = a.get("values") or []
            profile_lines.append(f"{a.get('id')}: {', '.join(vals)}")
        elif t == "likert":
            profile_lines.append(f"{a.get('id')}: {a.get('value')}")
        elif t == "short_text":
            txt = (a.get("value") or "").strip()
            if txt:
                profile_lines.append(f"{a.get('id')}: {txt}")
    profile_text = "\n".join(profile_lines) or "No answers provided."

    # Build a pain query from MCQ values (plus role) to ground RAG search
    selected_mcq = [v for a in answers if (a.get("type") or "").lower() == "mcq" for v in (a.get("values") or [])]
    unique_mcq = sorted(set(selected_mcq))
    pain_query = f"{role} pains: {', '.join(unique_mcq)}" if unique_mcq else role

    # Retrieve relevant chunks
    results, meta = search_chunks(pain_query, top_k=6)
    ctx = "\n\n".join(
        [f"[{r['source_path']}#{r['chunk_index']}] {r['text']}" for r in results]
    ) if results else ""

    # Very simple savings heuristics (you can refine later)
    selected_set = set(unique_mcq)
    savings = {
        "inventory_reduction_pct": 8 if "Overstock" in selected_set else 3,
        "stockout_reduction_pct": 15 if "Stockouts" in selected_set else 5,
        "otd_improvement_pct": 12 if any("Supplier" in s for s in selected_set) else 4,
        "notes": "Estimates based on benchmarks; refine with baseline metrics."
    }

    # Optional: LLM summary (guarded)
    summary = None
    if OPENAI_PRESENT:
        try:
            from openai import OpenAI
            client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
            model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

            prompt = (
                "You are the GSOS assistant.\n\n"
                "Task: Using ONLY the supplied context (if any) plus the respondent profile, "
                "produce three sections:\n"
                "1) Savings simulation summary (bullet points, crisp)\n"
                "2) Near-term solution snapshot (what GSOS will do first 4–8 weeks)\n"
                "3) Onboarding nudge (1 short paragraph)\n\n"
                f"ROLE: {role}\n\n"
                f"PROFILE:\n{profile_text}\n\n"
                f"CONTEXT (citations in [file#chunk] form):\n{ctx if ctx else '(no indexed context found)'}\n\n"
                "Now produce the three sections in plain text."
            )

            rsp = client.chat.completions.create(
                model=model,
                temperature=0.2,
                messages=[
                    {"role": "system", "content": "Be concise, concrete, and business-friendly."},
                    {"role": "user", "content": prompt},
                ],
            )
            summary = rsp.choices[0].message.content
        except Exception as e:
            logger.exception(f"OpenAI compose failed: {e}")
            summary = None

    plans = [
        {"name": "Starter","price_range": "$199–$399/mo","features": ["Survey", "Basic dashboards","Email support","Up to 3 integrations"],"fit":"Early-stage"},
        {"name": "Growth","price_range": "$499–$999/mo","features": ["RAG insights","Replenishment helper","Priority support","Up to 6 integrations"],"fit":"Scaling brands"},
        {"name": "Scale","price_range": "$1500–$3000/mo","features": ["Full suite","Custom connectors","SLA support","Unlimited integrations"],"fit":"Enterprises"},
    ]

    return {
        "ok": True,
        "savings": savings,
        "summary": summary,
        "citations": [{"source": r["source_path"], "chunk": r["chunk_index"]} for r in results],
        "plans": plans,
        "onboarding": {
            "question": "Would you like to onboard GSOS?",
            "options": ["Immediately","1–2 months","Quarterly","Not now"]
        },
        "meta": meta.get("meta", {}),
    }

# -------------------------
# Admin utilities
# -------------------------
@app.get("/admin/list-docs")
def list_docs(_=Depends(require_key)):
    out = []
    for root, _, files in os.walk(DOCS_DIR):
        for fn in files:
            p = os.path.join(root, fn)
            rel = os.path.relpath(p, DOCS_DIR)
            try: size = os.path.getsize(p)
            except: size = -1
            out.append({"path": rel, "size": size})
    return {"ok": True, "docs_dir": DOCS_DIR, "files": out}

@app.post("/admin/reingest")
def reingest(only_file: Optional[str] = Query(None), force_openai: bool = Query(False), _=Depends(require_key)):
    payload = ingest_docs_to_json(only_file=only_file, force_openai=force_openai)
    return {"ok": True, "meta": payload["meta"]}

@app.get("/admin/index-meta")
def index_meta(_=Depends(require_key)):
    if not os.path.exists(DATA_PATH): return {"ok": True,"meta":{"created_at":0,"count":0,"embed_backend":"none"}}
    with open(DATA_PATH,"r",encoding="utf-8") as f: idx=json.load(f)
    return {"ok": True,"meta":idx.get("meta",{})}

@app.get("/admin/download-index")
def download_index(_=Depends(require_key)):
    if not os.path.exists(DATA_PATH): return JSONResponse({"ok":False,"error":"index not found"},status_code=404)
    return FileResponse(DATA_PATH,media_type="application/json",filename="gsos_chunks.json")

@app.post("/admin/upload")
def admin_upload(file: UploadFile = File(...), _=Depends(require_key)):
    allowed={".docx",".pdf",".md",".txt",".html",".htm"}
    name=file.filename or "uploaded"; ext=os.path.splitext(name)[1].lower()
    if ext not in allowed: raise HTTPException(status_code=400,detail=f"unsupported_extension:{ext}")
    os.makedirs(DOCS_DIR,exist_ok=True); dest=os.path.join(DOCS_DIR,name)
    with open(dest,"wb") as out: shutil.copyfileobj(file.file,out)
    payload=ingest_docs_to_json()
    return {"ok":True,"saved":name,"meta":payload["meta"]}
