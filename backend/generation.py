import os, json, random, hashlib
from typing import List

from schemas import Question, GenerateQuery


def _fallback_questions(q: GenerateQuery) -> List[Question]:
    """
    Deterministic local fallback (no OpenAI).
    Keeps you unblocked if OPENAI_API_KEY is absent.
    """
    rnd = random.Random(q.seed or 42)
    role = q.role
    mcq_bank = [
        (
            "What best describes your current inventory management?",
            ["Manual spreadsheets", "Basic POS", "ERP-lite", "Full ERP with APIs"],
        ),
        (
            "How do you fulfill orders today?",
            ["Own fleet", "3PL", "Marketplace-fulfilled", "Mixed"],
        ),
        (
            "Primary pain area impacting margins?",
            ["Working capital", "Stockouts", "Leakage/shrinkage", "Compliance delays"],
        ),
    ]
    likert_bank = [
        "Our demand forecasting is accurate across seasons.",
        "Supplier reliability (OTD) meets our targets.",
        "We have visibility on shipments end-to-end.",
        "Invoice/PO reconciliation is error-free.",
        "Compliance/KYC adds minimal friction.",
    ]
    qs: List[Question] = []
    for i in range(q.count):
        h = hashlib.sha1(f"{role}-{i}-{rnd.random()}".encode()).hexdigest()[:8]
        if i % 4 == 0:
            m = rnd.choice(mcq_bank)
            qs.append(Question(id=f"q_{h}", type="mcq", prompt=m[0], options=m[1]))
        elif i % 4 in (1, 2):
            p = rnd.choice(likert_bank)
            qs.append(Question(id=f"q_{h}", type="likert", prompt=p, min=1, max=5))
        else:
            qs.append(
                Question(
                    id=f"q_{h}",
                    type="short_text",
                    prompt="Briefly describe your current process gap to reach 2× scale.",
                )
            )
    return qs


def generate_with_openai(q: GenerateQuery) -> List[Question]:
    """
    Generates survey questions with OpenAI, grounded in GSOS chunks (JSON).
    Requires OPENAI_API_KEY. Falls back to local if anything goes wrong.
    """
    from openai import OpenAI
    from search import search_chunks

    # Build context from chunks relevant to this role
    query = f"GSOS readiness and operational considerations for role={q.role}"
    top, _ = search_chunks(query, top_k=max(6, q.count))
    context = "\n\n".join([f"[{t['source_path']}#{t['chunk_index']}] {t['text']}" for t in top]) or "No context."

    sys = (
        "You are an expert survey designer for GSOS TATHAASTU. "
        "Create a concise, role-aware readiness survey grounded strictly in the provided context. "
        "Return exactly JSON with fields: questions[{id,type,prompt,options?,min?,max?}]. "
        "Types allowed: mcq, likert, short_text. MCQs have 3–6 concise options. Likert is 1–5. "
        "Avoid duplication; keep prompts specific and unambiguous."
    )
    user = f"role={q.role}; count={q.count}\nContext:\n{context}"

    try:
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        rsp = client.chat.completions.create(
            model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            temperature=0.2,
            messages=[
                {"role": "system", "content": sys},
                {"role": "user", "content": user},
            ],
            response_format={"type": "json_object"},
        )
        data = json.loads(rsp.choices[0].message.content)
        return [Question(**x) for x in data["questions"]]
    except Exception:
        # If OpenAI fails for any reason, keep the API reliable with fallback
        return _fallback_questions(q)