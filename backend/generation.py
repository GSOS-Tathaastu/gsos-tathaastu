import random, hashlib, os, json
from typing import List
from .schemas import Question, GenerateQuery
from openai import OpenAI

def _fallback_questions(q: GenerateQuery) -> List[Question]:
    rnd = random.Random(q.seed or 42)
    role = q.role
    mcq_bank = [
        ("What best describes your current inventory management?", 
         ["Manual spreadsheets","Basic POS","ERP-lite","Full ERP with APIs"]),
        ("How do you fulfill orders today?",
         ["Own fleet","3PL","Marketplace-fulfilled","Mixed"]),
        ("Primary pain area impacting margins?",
         ["Working capital","Stockouts","Leakage/shrinkage","Compliance delays"]),
    ]
    likert_bank = [
        "Our demand forecasting is accurate across seasons.",
        "Supplier reliability (OTD) meets our targets.",
        "We have visibility on shipments end-to-end.",
        "Invoice/PO reconciliation is error-free.",
        "Compliance/KYC adds minimal friction."
    ]
    qs: List[Question] = []
    for i in range(q.count):
        h = hashlib.sha1(f"{role}-{i}-{rnd.random()}".encode()).hexdigest()[:8]
        if i % 4 == 0:
            m = rnd.choice(mcq_bank)
            qs.append(Question(id=f"q_{h}", type="mcq", prompt=m[0], options=m[1]))
        elif i % 4 in (1,2):
            p = rnd.choice(likert_bank)
            qs.append(Question(id=f"q_{h}", type="likert", prompt=p, min=1, max=5))
        else:
            qs.append(Question(id=f"q_{h}", type="short_text",
                               prompt="Briefly describe your current process gap to reach 2× scale."))
    return qs

def generate_with_openai(q: GenerateQuery) -> List[Question]:
    if not os.getenv("OPENAI_API_KEY"):
        return _fallback_questions(q)
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    sys = ("You generate a compact, role-aware survey for supply chain and trade enablement. "
           "Return exactly JSON with fields: role, questions[{id,type,prompt,options?,min?,max?}]. "
           "Types allowed: mcq, likert, short_text. MCQs have 3–6 concise options. Likert is 1–5.")
    user = f"role={q.role}; count={q.count}"
    try:
        rsp = client.chat.completions.create(
            model=os.getenv("OPENAI_MODEL","gpt-4o-mini"),
            temperature=0.2,
            messages=[{"role":"system","content":sys},{"role":"user","content":user}],
            response_format={"type":"json_object"}
        )
        data = json.loads(rsp.choices[0].message.content)
        questions = [Question(**x) for x in data["questions"]]
        return questions
    except Exception:
        return _fallback_questions(q)
