from sqlalchemy.orm import Session
from backend.models import Asset, Event, Vulnerability, SecurityIntelligence, BusinessContext, Dependency
from backend.schemas.security_context import SecurityContextOutput

def generate_security_context(db: Session, asset_id: str) -> SecurityContextOutput:
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise ValueError("Asset not found")
        
    business_ctx = db.query(BusinessContext).filter(BusinessContext.asset_id == asset_id).first()
    events = db.query(Event).filter(Event.asset_id == asset_id).all()
    vulns = db.query(Vulnerability).filter(Vulnerability.asset_id == asset_id).all()
    intel = db.query(SecurityIntelligence).filter(SecurityIntelligence.asset_id == asset_id).all()
    deps = db.query(Dependency).filter(Dependency.source_asset_id == asset_id).all()
    
    # Gather raw evidence for transparency
    evidence_ids = set()
    for i in intel:
        evidence_ids.update(i.evidence_ids)
    
    evidence_records = db.query(Event).filter(Event.id.in_(list(evidence_ids))).all()
    
    return SecurityContextOutput(
        asset={
            "id": asset.id,
            "name": asset.name,
            "type": asset.asset_type,
            "environment": asset.environment,
            "internet_exposed": asset.internet_exposed
        },
        business_context={
            "criticality": business_ctx.criticality,
            "business_function": business_ctx.business_function,
            "data_sensitivity": business_ctx.data_sensitivity,
            "revenue_dependency": business_ctx.revenue_dependency
        } if business_ctx else None,
        security_context={
            "events": [{"id": e.id, "type": e.event_type, "severity": e.severity} for e in events],
            "vulnerabilities": [{"id": v.id, "cve": v.cve, "severity": v.severity} for v in vulns],
            "threats": [], # Populated similarly
            "identities": [],
            "controls": []
        },
        dependencies=[{"target": d.target_asset_id, "type": d.relationship_type} for d in deps],
        intelligence=[{
            "classification": i.classification,
            "confidence": i.confidence,
            "explanation": i.explanation,
            "mitre_technique": i.mitre_technique,
            "evidence": i.evidence_ids,
            "model": i.model,
            "validation_status": i.validation_status
        } for i in intel],
        evidence=[{"id": e.id, "raw_event": e.raw_event, "source": e.source} for e in evidence_records]
    )


