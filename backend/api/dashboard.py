from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from backend.database import get_db
from backend.models import Asset, SecurityEvent, Vulnerability, SecurityIntelligence

router = APIRouter()

@router.get("/dashboard/summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    total_assets = db.query(Asset).count()
    exposed_assets = db.query(Asset).filter(Asset.internet_exposed == True).count()
    critical_vulns = db.query(Vulnerability).filter(Vulnerability.severity == "Critical").count()
    active_threats = db.query(SecurityIntelligence).count()
    
    severity_counts = db.query(SecurityEvent.severity, func.count(SecurityEvent.id))\
        .group_by(SecurityEvent.severity).all()
    
    severity_dict = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0}
    for sev, count in severity_counts:
        if sev in severity_dict:
            severity_dict[sev] = count
            
    recent_events = db.query(SecurityEvent).order_by(SecurityEvent.timestamp.desc()).limit(8).all()
    recent_events_data = [{
        "id": e.id,
        "type": e.event_type.replace('_', ' ').title() if e.event_type else "Unknown",
        "severity": e.severity or "Unknown",
        "asset": e.asset_id or "Unknown",
        "timestamp": e.timestamp.strftime("%H:%M:%S") if e.timestamp else "Unknown"
    } for e in recent_events]

    return {
        "kpi": {
            "total_assets": total_assets,
            "exposed_assets": exposed_assets,
            "critical_vulns": critical_vulns,
            "active_threats": active_threats
        },
        "severity_breakdown": severity_dict,
        "recent_events": recent_events_data,
        "last_updated": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    }
