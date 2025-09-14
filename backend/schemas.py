from pydantic import BaseModel
from typing import List, Optional

class Question(BaseModel):
class Question(BaseModel):
    id: str
    type: str  # "mcq" | "likert" | "short_text"
    prompt: str
    options: Optional[List[str]] = None
    min: Optional[int] = None
    max: Optional[int] = None
    multi: Optional[bool] = False


class GenerateQuery(BaseModel):
    role: str
    count: int
    seed: Optional[int] = None

class GenerateResponse(BaseModel):
    role: str
    questions: List[Question]
