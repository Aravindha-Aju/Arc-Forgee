from database import SessionLocal, engine, Base
from models import FinancialProfile, AssetDependency, RiskAssessment
from engine import calculate_financials, calculate_blast_radius, calculate_risk_score, generate_mitigation

def seed_data():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # Clear existing
    db.query(RiskAssessment).delete()
    db.query(AssetDependency).delete()
    db.query(FinancialProfile).delete()
    
    # 1. Financial Profiles
    profiles = [
        FinancialProfile(asset_id="ASSET-001", asset_name="payment-prod-01", asset_value=2500000, exposure_factor=0.6, revenue_dependency="Critical", regulatory_fine_risk=500000),
        FinancialProfile(asset_id="ASSET-002", asset_name="db-server-01", asset_value=1500000, exposure_factor=0.8, revenue_dependency="Critical", regulatory_fine_risk=1000000),
        FinancialProfile(asset_id="ASSET-003", asset_name="web-frontend-01", asset_value=500000, exposure_factor=0.3, revenue_dependency="High", regulatory_fine_risk=50000),
        FinancialProfile(asset_id="ASSET-004", asset_name="dev-api-01", asset_value=100000, exposure_factor=0.2, revenue_dependency="Low", regulatory_fine_risk=0),
        FinancialProfile(asset_id="ASSET-005", asset_name="hr-portal-01", asset_value=300000, exposure_factor=0.5, revenue_dependency="Medium", regulatory_fine_risk=200000),
    ]
    db.add_all(profiles)
    
    # 2. Dependencies (Source depends on Target)
    deps = [
        AssetDependency(source_asset_id="ASSET-001", target_asset_id="ASSET-002"), # Payment depends on DB
        AssetDependency(source_asset_id="ASSET-003", target_asset_id="ASSET-001"), # Web depends on Payment
        AssetDependency(source_asset_id="ASSET-003", target_asset_id="ASSET-002"), # Web depends on DB
        AssetDependency(source_asset_id="ASSET-005", target_asset_id="ASSET-002"), # HR depends on DB
    ]
    db.add_all(deps)
    
    db.commit()
    
    # 3. Generate and Save Risk Assessments for each profile
    max_ale = 5000000 # Baseline for normalization
    for p in profiles:
        # Mock threat likelihood (higher for prod/db)
        threat_likelihood = 0.65 if "prod" in p.asset_id.lower() or "db" in p.asset_id.lower() else 0.25
        
        financials = calculate_financials(p, threat_likelihood)
        blast_radius = calculate_blast_radius(db, p.asset_id)
        risk_score = calculate_risk_score(threat_likelihood, financials["ale"], max_ale, blast_radius["total_impacted"])
        mitigation = generate_mitigation(p, threat_likelihood)
        
        assessment = RiskAssessment(
            asset_id=p.asset_id,
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
    print("✅ Risk Engine Database seeded successfully with 5 assets, 4 dependencies, and calculated risk assessments!")
    db.close()

if __name__ == "__main__":
    seed_data()
