from pydantic import BaseModel
from typing import List

class GeminiIntelligenceResponse(BaseModel):
    classification: str
    confidence: float
    explanation: str
    mitre_technique: str
    model: str = "Gemini"
    model_version: str = "gemini-1.5-flash"
    validation_status: str = "validated"
    evidence: List[str]
