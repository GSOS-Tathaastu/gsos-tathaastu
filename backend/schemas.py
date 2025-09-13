from pydantic import BaseModel, Field
from typing import List, Literal, Optional

Role = Literal["retailer","manufacturer","logistics","financier","government"]

class GenerateQuery(BaseModel):
    role: Role = "retailer"
    count: int = Field(default=6, ge=1, le=20)
    seed: Optional[int] = None

class Question(BaseModel):
    id: str
    type: Literal["mcq","likert","short_text"]
    prompt: str
    options: Optional[List[str]] = None
    min: Optional[int] = None
    max: Optional[int] = None

class GenerateResponse(BaseModel):
    role: Role
    questions: List[Question]
