from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from models import FinancialProfile, RiskAssessment, AssetDependency
from engine import calculate_financials, calculate_blast_radius, calculate_risk_score, generate_mitigation

router = APIRouter()

class IntelUpdatePayload(BaseModel):
    asset_id: str
    classification: str
    confidence: float
    mitre_technique: Optional[str] = None
    evidence_ids: List[str] = []

def classification_to_likelihood(classification: str, confidence: float) -> float:
    """Convert AI classification + confidence into threat likelihood (0-1)"""
    base_weights = {
        "possible_brute_force": 0.8,
        "malware_attempt": 0.9,
        "malware_attempt_blocked": 0.4,
        "network_reconnaissance": 0.5,
        "data_exfiltration": 0.85,
        "privilege_escalation": 0.75,
        "credential_compromise": 0.9,
        "routine_activity": 0.05,
        "no_actionable_finding": 0.0,
    }
    base = base_weights.get(classification.lower().replace("-", "_"), 0.3)
    return min(1.0, base * confidence)

@router.post("/api/risk/update-from-intel")
async def update_risk_from_intel(payload: IntelUpdatePayload, db: Session = Depends(get_db)):
    """Called by Block 1 after AI analysis completes"""
    profile = db.query(FinancialProfile).filter(FinancialProfile.asset_id == payload.asset_id).first()
    if not profile:
        return {"status": "skipped", "reason": "Asset not in risk portfolio"}
    
    # Calculate new threat likelihood from AI intelligence
    threat_likelihood = classification_to_likelihood(payload.classification, payload.confidence)
    
    # Recalculate everything
    financials = calculate_financials(profile, threat_likelihood)
    blast_radius = calculate_blast_radius(db, payload.asset_id)
    max_ale = 5000000
    risk_score = calculate_risk_score(threat_likelihood, financials["ale"], max_ale, blast_radius["total_impacted"])
    mitigation = generate_mitigation(profile, threat_likelihood)
    
    # Update or create assessment
    assessment = db.query(RiskAssessment).filter(RiskAssessment.asset_id == payload.asset_id).first()
    old_score = assessment.risk_score if assessment else None
    
    if assessment:
        assessment.threat_likelihood = threat_likelihood
        assessment.sle = financials["sle"]
        assessment.ale = financials["ale"]
        assessment.blast_radius_count = blast_radius["total_impacted"]
        assessment.risk_score = risk_score
        assessment.top_mitigation = mitigation["action"]
        assessment.mitigation_roi = mitigation["roi"]
    else:
        assessment = RiskAssessment(
            asset_id=payload.asset_id,
            threat_likelihood=threat_likelihood,
            sle=financials["sle"],
            ale=financials["ale"],
            blast_radius_count=blast_radius["total_impacted"],
            risk_score=risk_score,
            top_mitigation=mitigation["action"],
            mitigation_roi=mitigation["roi"]
        )
        db.add(assessment)
    
    db.commit()
    
    # Broadcast update via WebSocket
    try:
        from enhanced import manager
        await manager.broadcast({
            "type": "risk_update",
            "asset_id": payload.asset_id,
            "asset_name": profile.asset_name,
            "old_score": old_score,
            "new_score": risk_score,
            "classification": payload.classification,
            "confidence": payload.confidence,
            "ale": financials["ale"]
        })
    except Exception as e:
        print(f"WebSocket broadcast failed: {e}")
    
    return {
        "status": "updated",
        "asset_id": payload.asset_id,
        "old_score": old_score,
        "new_score": risk_score,
        "threat_likelihood": threat_likelihood,
        "ale": financials["ale"]
    }

@router.get("/api/risk/integration-status")
def integration_status():
    """Health check for Block 1 integration"""
    return {"status": "online", "block": "Block 2 Risk Engine", "version": "1.0"}
