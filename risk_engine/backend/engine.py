import networkx as nx
from sqlalchemy.orm import Session
from models import FinancialProfile, AssetDependency, RiskAssessment

def calculate_financials(profile: FinancialProfile, threat_likelihood: float) -> dict:
    # FAIR-Lite Calculation
    sle = profile.asset_value * profile.exposure_factor
    aro = threat_likelihood * 12 # Approximate annualized rate based on monthly likelihood
    ale = sle * aro
    
    return {"sle": round(sle, 2), "ale": round(ale, 2)}

def calculate_blast_radius(db: Session, asset_id: str) -> dict:
    # Build directed graph: Source depends on Target
    G = nx.DiGraph()
    deps = db.query(AssetDependency).all()
    for dep in deps:
        G.add_edge(dep.source_asset_id, dep.target_asset_id)
    
    if asset_id not in G:
        return {"upstream": [], "downstream": [], "total_impacted": 0}
    
    # Downstream: Assets that depend on this asset (if this fails, they fail)
    downstream = list(nx.descendants(G, asset_id))
    # Upstream: Assets this asset depends on
    upstream = list(nx.ancestors(G, asset_id))
    
    return {
        "upstream": upstream,
        "downstream": downstream,
        "total_impacted": len(downstream)
    }

def calculate_risk_score(threat_likelihood: float, ale: float, max_ale: float, blast_radius: int) -> int:
    # Normalize ALE to 0-100 scale
    ale_normalized = min((ale / max_ale) * 100, 100) if max_ale > 0 else 0
    # Blast radius multiplier (max 1.5x for high blast radius)
    br_multiplier = 1.0 + min(blast_radius * 0.1, 0.5)
    
    # Score = (Likelihood weight 40% + Impact weight 60%) * Blast Radius
    base_score = (threat_likelihood * 40) + (ale_normalized * 0.6)
    final_score = int(min(base_score * br_multiplier, 100))
    return final_score

def generate_mitigation(profile: FinancialProfile, threat_likelihood: float) -> dict:
    if threat_likelihood > 0.7:
        return {
            "action": "Isolate asset and enforce MFA immediately",
            "roi": round(profile.asset_value * 0.4, 2) # Saves 40% of asset value
        }
    elif profile.exposure_factor > 0.5:
        return {
            "action": "Implement network segmentation and strict ACLs",
            "roi": round(profile.asset_value * 0.3, 2)
        }
    else:
        return {
            "action": "Enable enhanced logging and weekly vulnerability scans",
            "roi": round(profile.asset_value * 0.1, 2)
        }
