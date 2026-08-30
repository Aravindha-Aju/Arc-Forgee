from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import networkx as nx
from database import engine, get_db, Base
from models import FinancialProfile, AssetDependency, RiskAssessment
from enhanced import router as enhanced_router
from integration import router as integration_router
from engine import calculate_financials, calculate_blast_radius, calculate_risk_score, generate_mitigation

Base.metadata.create_all(bind=engine)

app = FastAPI(title="MarkX Risk Engine")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(enhanced_router)
app.include_router(integration_router)

@app.get("/api/portfolio")
def get_portfolio(db: Session = Depends(get_db)):
    profiles = db.query(FinancialProfile).all()
    assessments = {a.asset_id: a for a in db.query(RiskAssessment).all()}
    
    results = []
    max_ale = max([a.ale for a in assessments.values()], default=1)
    
    for p in profiles:
        a = assessments.get(p.asset_id)
        if a:
            results.append({
                "asset_id": p.asset_id,
                "asset_name": p.asset_name,
                "risk_score": a.risk_score,
                "ale": a.ale,
                "blast_radius": a.blast_radius_count,
                "criticality": p.revenue_dependency
            })
    return sorted(results, key=lambda x: x["risk_score"], reverse=True)

@app.get("/api/asset/{asset_id}")
def get_asset_risk(asset_id: str, db: Session = Depends(get_db)):
    profile = db.query(FinancialProfile).filter(FinancialProfile.asset_id == asset_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    # Mock threat likelihood for standalone demo (in prod, this comes from Block 1)
    threat_likelihood = 0.65 if "prod" in asset_id.lower() else 0.25
    
    financials = calculate_financials(profile, threat_likelihood)
    blast_radius = calculate_blast_radius(db, asset_id)
    max_ale = 5000000 # Baseline for normalization
    
    risk_score = calculate_risk_score(threat_likelihood, financials["ale"], max_ale, blast_radius["total_impacted"])
    mitigation = generate_mitigation(profile, threat_likelihood)
    
    # Save or update assessment
    assessment = db.query(RiskAssessment).filter(RiskAssessment.asset_id == asset_id).first()
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
            asset_id=asset_id, threat_likelihood=threat_likelihood,
            sle=financials["sle"], ale=financials["ale"],
            blast_radius_count=blast_radius["total_impacted"], risk_score=risk_score,
            top_mitigation=mitigation["action"], mitigation_roi=mitigation["roi"]
        )
        db.add(assessment)
    db.commit()
    
    return {
        "profile": {
            "asset_id": profile.asset_id,
            "asset_name": profile.asset_name,
            "asset_value": profile.asset_value,
            "exposure_factor": profile.exposure_factor,
            "revenue_dependency": profile.revenue_dependency,
            "regulatory_fine_risk": profile.regulatory_fine_risk
        },
        "financials": financials,
        "blast_radius": blast_radius,
        "assessment": {
            "risk_score": risk_score,
            "top_mitigation": mitigation["action"],
            "mitigation_roi": mitigation["roi"]
        }
    }
