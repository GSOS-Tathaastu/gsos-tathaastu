# backend/schemas.py
from typing import List, Optional, Literal, Union
from pydantic import BaseModel, Field

QuestionType = Literal["mcq", "likert", "short_text"]

class Question(BaseModel):
    id: str
    type: QuestionType
    prompt: str
    # MCQ
    options: Optional[List[str]] = None
    multi: Optional[bool] = False
    # Likert
    min: Optional[int] = None
    max: Optional[int] = None

class GenerateQuery(BaseModel):
    role: str
    count: int = 12
    seed: Optional[int] = None

class GenerateResponse(BaseModel):
    role: str
    questions: List[Question]

# Optional: typed analyze payload (backend doesn’t strictly require it,
# but this helps future validation/use).
class AnalyzeMCQ(BaseModel):
    id: str
    type: Literal["mcq"]
    values: List[str]

class AnalyzeLikert(BaseModel):
    id: str
    type: Literal["likert"]
    value: int

class AnalyzeShortText(BaseModel):
    id: str
    type: Literal["short_text"]
    value: str

AnalyzePayload = Union[AnalyzeMCQ, AnalyzeLikert, AnalyzeShortText]
