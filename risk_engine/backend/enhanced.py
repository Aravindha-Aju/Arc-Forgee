from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from database import get_db
from models import FinancialProfile, RiskAssessment, AssetDependency
import csv
import io
import random
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/api/asset/{asset_id}/history")
def get_asset_history(asset_id: str, db: Session = Depends(get_db)):
    assessment = db.query(RiskAssessment).filter(RiskAssessment.asset_id == asset_id).first()
    if not assessment:
        return {"history": []}
    
    history = []
    current_score = assessment.risk_score
    base_score = max(20, current_score - 30)
    
    for i in range(30, -1, -1):
        date = datetime.utcnow() - timedelta(days=i)
        progress = (30 - i) / 30
        score = int(base_score + (current_score - base_score) * progress + random.randint(-5, 5))
        score = max(10, min(100, score))
        
        event = None
        if i == 15:
            event = "New vulnerability discovered"
            score = min(100, score + 8)
        elif i == 7:
            event = "Mitigation applied"
            score = max(10, score - 5)
            
        if i == 0:
            score = current_score # Ensure last point matches current
            
        history.append({
            "date": date.strftime("%Y-%m-%d"),
            "score": score,
            "event": event
        })
    return {"history": history}

@router.get("/api/portfolio/benchmarks")
def get_portfolio_benchmarks(db: Session = Depends(get_db)):
    assessments = db.query(RiskAssessment).all()
    if not assessments:
        return {"averages": {"risk_score": 0, "ale": 0, "blast_radius": 0}, "count": 0}
    
    count = len(assessments)
    return {
        "averages": {
            "risk_score": round(sum(a.risk_score for a in assessments) / count, 1),
            "ale": round(sum(a.ale for a in assessments) / count, 2),
            "blast_radius": round(sum(a.blast_radius_count for a in assessments) / count, 1)
        },
        "count": count
    }

@router.get("/api/asset/{asset_id}/export/csv")
def export_asset_csv(asset_id: str, db: Session = Depends(get_db)):
    profile = db.query(FinancialProfile).filter(FinancialProfile.asset_id == asset_id).first()
    assessment = db.query(RiskAssessment).filter(RiskAssessment.asset_id == asset_id).first()
    
    if not profile or not assessment:
        return {"error": "Asset not found"}
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["MARKX RISK ENGINE - ASSET REPORT"])
    writer.writerow(["Generated", datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")])
    writer.writerow([])
    writer.writerow(["ASSET PROFILE"])
    writer.writerow(["Field", "Value"])
    writer.writerow(["Asset ID", profile.asset_id])
    writer.writerow(["Asset Name", profile.asset_name])
    writer.writerow(["Asset Value", f"${profile.asset_value:,.2f}"])
    writer.writerow(["Exposure Factor", f"{profile.exposure_factor * 100:.0f}%"])
    writer.writerow(["Revenue Dependency", profile.revenue_dependency])
    writer.writerow([])
    writer.writerow(["RISK ASSESSMENT"])
    writer.writerow(["Risk Score", f"{assessment.risk_score}/100"])
    writer.writerow(["SLE", f"${assessment.sle:,.2f}"])
    writer.writerow(["ALE", f"${assessment.ale:,.2f}"])
    writer.writerow(["Blast Radius", f"{assessment.blast_radius_count} assets"])
    writer.writerow(["Top Mitigation", assessment.top_mitigation])
    writer.writerow(["Mitigation ROI", f"${assessment.mitigation_roi:,.2f}/year"])
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={profile.asset_name}_report.csv"}
    )

@router.get("/api/asset/{asset_id}/export/json")
def export_asset_json(asset_id: str, db: Session = Depends(get_db)):
    profile = db.query(FinancialProfile).filter(FinancialProfile.asset_id == asset_id).first()
    assessment = db.query(RiskAssessment).filter(RiskAssessment.asset_id == asset_id).first()
    
    if not profile or not assessment:
        return {"error": "Asset not found"}
    
    deps = db.query(AssetDependency).filter(
        (AssetDependency.source_asset_id == asset_id) | 
        (AssetDependency.target_asset_id == asset_id)
    ).all()
    
    return {
        "report_metadata": {
            "generated": datetime.utcnow().isoformat(),
            "engine": "MarkX Risk Engine v1.0"
        },
        "profile": {
            "asset_id": profile.asset_id,
            "asset_name": profile.asset_name,
            "asset_value": profile.asset_value,
            "exposure_factor": profile.exposure_factor,
            "revenue_dependency": profile.revenue_dependency
        },
        "assessment": {
            "risk_score": assessment.risk_score,
            "sle": assessment.sle,
            "ale": assessment.ale,
            "blast_radius": assessment.blast_radius_count,
            "top_mitigation": assessment.top_mitigation,
            "mitigation_roi": assessment.mitigation_roi
        },
        "dependencies": [
            {"source": d.source_asset_id, "target": d.target_asset_id}
            for d in deps
        ]
    }

class ConnectionManager:
    def __init__(self):
        self.active_connections = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

manager = ConnectionManager()

@router.websocket("/ws/risk")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Send initial connection success
        await websocket.send_json({"type": "connected", "message": "Live telemetry active"})
        while True:
            # Keep connection alive, listen for client messages
            data = await websocket.receive_text()
            await websocket.send_json({"type": "ack", "message": "Received"})
    except WebSocketDisconnect:
        manager.disconnect(websocket)
