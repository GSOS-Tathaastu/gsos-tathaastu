from fastapi import FastAPI, Depends, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
from dotenv import load_dotenv
import os
from .schemas import GenerateQuery, GenerateResponse
from .generation import generate_with_openai, _fallback_questions

load_dotenv()

API_KEY = os.getenv("BACKEND_API_KEY","")
ALLOW_ORIGINS = [os.getenv("ALLOW_ORIGIN","*")]

app = FastAPI(title="GSOS Survey Generator", version="1.0.0")

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
def generate(role: str = Query("retailer"),
             count: int = Query(6, ge=1, le=20),
             seed: int | None = None,
             _=Depends(require_key)):
    q = GenerateQuery(role=role, count=count, seed=seed)
    questions = generate_with_openai(q) if os.getenv("OPENAI_API_KEY") else _fallback_questions(q)
    logger.info(f"Generated {len(questions)} questions for role={role}")
    return {"role": q.role, "questions": [qq.model_dump() for qq in questions]}
