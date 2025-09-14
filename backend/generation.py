# backend/generation.py
import os, random, hashlib, json
from typing import List
from schemas import Question, GenerateQuery
from search import search_chunks  # used by generate_with_openai

def _id(seed_text: str) -> str:
    return "q_" + hashlib.md5(seed_text.encode()).hexdigest()[:8]

def _fallback_questions(q: GenerateQuery) -> List[Question]:
    """
    Deterministic, role-aware fallback. Ensures 10–15 questions, mostly MCQ/Likert
    and includes one short_text at the end.
    """
    base = [
        ("Which challenges apply today?", ["Stockouts", "Overstock", "Slow turns", "Supplier delays", "Data silos"], True),
        ("What best describes your inventory process?", ["Manual spreadsheets", "Basic POS", "ERP-lite", "Full ERP (APIs)"], False),
        ("Which channels do you sell on?", ["Offline retail", "Own website", "Marketplaces", "Social commerce", "B2B"], True),
        ("Your current demand forecasting maturity?", ["None", "Simple moving avg", "Seasonality aware", "ML models"], False),
        ("Which integrations do you already use?", ["Tally/Zoho", "Shopify", "Woo", "SAP/Oracle", "Custom DB"], True),
        ("Supplier reliability (OTD) meets targets.", None, False),
        ("We can trace inventory at batch/lot level.", None, False),
        ("Our lead-time variability is under control.", None, False),
        ("We have ABC/XYZ classification live.", None, False),
        ("Replenishment is automated for top SKUs.", None, False),
    ]
    rnd = random.Random(q.seed or 42)
    rnd.shuffle(base)

    want = min(max(q.count, 10), 15)
    out: List[Question] = []

    for i, (prompt, opts, multi) in enumerate(base[:want - 1]):  # keep last slot for short_text
        if opts:
            out.append(Question(
                id=_id(prompt+str(i)),
                type="mcq",
                prompt=prompt,
                options=opts,
                multi=bool(multi),
            ))
        else:
            out.append(Question(
                id=_id(prompt+str(i)),
                type="likert",
                prompt=prompt,
                min=1, max=5,
            ))

    # ensure one open-ended for nuance
    out.append(Question(
        id=_id("open_ended_"+q.role),
        type="short_text",
        prompt="Briefly describe your biggest process gap to reach 2× scale.",
    ))

    return out

def generate_with_openai(q: GenerateQuery) -> List[Question]:
    """
    Generates survey questions with OpenAI, grounded in GSOS chunks (JSON).
    Types allowed: mcq | likert | short_text. Includes multi for MCQ.
    """
    from openai import OpenAI

    # Build context from chunks relevant to this role
    query = f"GSOS readiness and operational considerations for role={q.role}"
    top, _ = search_chunks(query, top_k=max(6, q.count))
    context = "\n\n".join([f"[{t['source_path']}#{t['chunk_index']}] {t['text']}" for t in top]) or "No context."

    sys = (
        "You are an expert survey designer for GSOS TATHAASTU. "
        "Create a concise, role-aware readiness survey grounded strictly in the provided context. "
        "Return exactly JSON: {\"questions\":[{\"id\",\"type\",\"prompt\",\"options?\",\"min?\",\"max?\",\"multi?\"}]}. "
        "Types allowed: mcq, likert, short_text. MCQs have 3–6 concise options; Likert is 1–5. "
        "Include at least one short_text. Avoid duplicates and keep prompts specific."
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
        # Validate and coerce minimal fields
        out: List[Question] = []
        for x in data.get("questions", []):
            t = x.get("type")
            if t not in {"mcq", "likert", "short_text"}:
                continue
            out.append(Question(
                id=x.get("id") or _id(x.get("prompt","")),
                type=t,
                prompt=x.get("prompt","").strip()[:280],
                options=x.get("options"),
                min=x.get("min"),
                max=x.get("max"),
                multi=bool(x.get("multi", False)),
            ))
        # Safety net: ensure 10–15 and at least one short_text
        if not any(q.type == "short_text" for q in out):
            out.append(Question(id=_id("short_text_fallback"), type="short_text",
                                prompt="Briefly describe your biggest process gap to reach 2× scale."))
        if len(out) < 10:
            out.extend(_fallback_questions(GenerateQuery(role=q.role, count=10 - len(out), seed=q.seed)))
        return out[:15]
    except Exception:
        # Keep the API reliable with fallback
        return _fallback_questions(q)
