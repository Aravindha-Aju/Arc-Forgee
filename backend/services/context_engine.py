from sqlalchemy.orm import Session
from backend.models import Asset, BusinessContext, SecurityEvent, Vulnerability, SecurityControl, Dependency, SecurityIntelligence
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class SecurityContextOutput(BaseModel):
    asset: Dict[str, Any]
    business_context: Optional[Dict[str, Any]]
    events: List[Dict[str, Any]]
    vulnerabilities: List[Dict[str, Any]]
    controls: List[Dict[str, Any]]
    dependencies: List[Dict[str, str]]
    intelligence: List[Dict[str, Any]]
    evidence: List[Dict[str, Any]]

def generate_security_context(db: Session, asset_id: str) -> SecurityContextOutput:
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise ValueError("Asset not found")
        
    biz_ctx = db.query(BusinessContext).filter(BusinessContext.asset_id == asset_id).first()
    events = db.query(SecurityEvent).filter(SecurityEvent.asset_id == asset_id).all()
    vulns = db.query(Vulnerability).filter(Vulnerability.asset_id == asset_id).all()
    controls = db.query(SecurityControl).filter(SecurityControl.asset_id == asset_id).all()
    deps = db.query(Dependency).filter(Dependency.source_asset_id == asset_id).all()
    intel = db.query(SecurityIntelligence).filter(SecurityIntelligence.asset_id == asset_id).all()
    
    # Gather all raw evidence referenced by validated intelligence
    evidence_ids = set()
    for i in intel:
        if i.validation_status in ["validated", "fallback"]:
            evidence_ids.update(i.evidence_ids)
    
    evidence_records = db.query(SecurityEvent).filter(SecurityEvent.id.in_(list(evidence_ids))).all()
    
    return SecurityContextOutput(
        asset={
            "id": asset.id, "name": asset.name, "type": asset.asset_type,
            "environment": asset.environment, "internet_exposed": asset.internet_exposed
        },
        business_context={
            "criticality": biz_ctx.criticality, "business_function": biz_ctx.business_function,
            "data_sensitivity": biz_ctx.data_sensitivity, "revenue_dependency": biz_ctx.revenue_dependency
        } if biz_ctx else None,
        events=[{"id": e.id, "type": e.event_type, "severity": e.severity, "timestamp": e.timestamp.isoformat()} for e in events],
        vulnerabilities=[{"id": v.id, "cve": v.cve, "severity": v.severity, "patch_status": v.patch_status} for v in vulns],
        controls=[{"name": c.name, "status": c.status} for c in controls],
        dependencies=[{"target": d.target_asset_id, "type": d.relationship_type} for d in deps],
        intelligence=[{
            "classification": i.classification, "confidence": i.confidence, "explanation": i.explanation,
            "mitre_technique": i.mitre_technique, "evidence": i.evidence_ids, "validation_status": i.validation_status
        } for i in intel],
        evidence=[{"id": e.id, "source": e.source, "raw_event": e.raw_event} for e in evidence_records]
    )


