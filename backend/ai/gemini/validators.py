from pydantic import BaseModel, Field
from typing import List
from sqlalchemy.orm import Session
from backend.models import Event

class GeminiIntelligenceResponse(BaseModel):
    classification: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    explanation: str
    mitre_technique: str
    evidence: List[str]

def validate_schema(data: dict) -> tuple[bool, str]:
    try:
        GeminiIntelligenceResponse(**data)
        return True, ""
    except Exception as e:
        return False, str(e)

def validate_evidence_exists(db: Session, ai_evidence_ids: List[str], original_evidence_ids: List[str]) -> tuple[bool, List[str]]:
    """Ensures AI only references evidence that was actually provided and exists in DB."""
    missing = []
    for eid in ai_evidence_ids:
        if eid not in original_evidence_ids:
            missing.append(eid)
            continue
        # Verify it exists in DB
        event = db.query(Event).filter(Event.id == eid).first()
        if not event:
            missing.append(eid)
            
    return len(missing) == 0, missing


