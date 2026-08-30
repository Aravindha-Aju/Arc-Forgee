from sqlalchemy.orm import Session
from backend.models import Asset, Event, Vulnerability, BusinessContext, Dependency, SecurityIntelligence
import uuid

def seed_demo_data(db: Session):
    # SCENARIO 1 & 2: Internet-facing payment server with brute force & critical vuln
    asset1 = Asset(
        id="ASSET-001", name="payment-prod-01", hostname="payment-prod-01", 
        ip_address="10.0.1.15", asset_type="Server", environment="production", 
        internet_exposed=True, owner="DevOps", department="Engineering"
    )
    db.add(asset1)
    
    db.add(BusinessContext(
        id=str(uuid.uuid4()), asset_id="ASSET-001", criticality="Critical",
        business_function="payment_processing", data_sensitivity="high", revenue_dependency="high"
    ))
    
    db.add(Vulnerability(
        id="VULN-001", cve="CVE-2024-1234", cvss=9.8, severity="Critical",
        description="Remote Code Execution in web framework", asset_id="ASSET-001", patch_status="unpatched"
    ))
    
    # Generate 47 failed login events
    event_ids = []
    for i in range(47):
        eid = f"EVENT-{1000+i}"
        event_ids.append(eid)
        db.add(Event(
            id=eid, source="wazuh", source_event_id=f"wazuh-{i}",
            event_type="failed_login", severity="Medium", source_ip="185.220.101.45",
            destination_ip="10.0.1.15", asset_id="ASSET-001", username="admin",
            action="authentication", result="failure",
            raw_event={"rule_id": 5710, "data": {"srcip": "185.220.101.45", "user": "admin"}}
        ))
        
    # Simulate Gemini Intelligence for Scenario 1
    db.add(SecurityIntelligence(
        id=str(uuid.uuid4()), asset_id="ASSET-001",
        classification="possible_brute_force", confidence=0.91,
        explanation="47 failed authentication attempts were detected against an administrative account on an internet-facing payment server.",
        mitre_technique="T1110", model="Gemini", model_version="gemini-1.5-flash",
        validation_status="validated", evidence_ids=event_ids[:5] # Reference actual events
    ))
    
    # SCENARIO 5: Amass Discovery
    asset2 = Asset(
        id="ASSET-002", name="dev-api.example.com", domain="example.com",
        ip_address="203.0.113.50", asset_type="Subdomain", environment="development",
        internet_exposed=True, discovery_source="owasp_amass", owner="Unassigned"
    )
    db.add(asset2)
    
    # Dependency Graph
    db.add(Dependency(id=str(uuid.uuid4()), source_asset_id="ASSET-001", target_asset_id="ASSET-003", relationship_type="depends_on"))
    # (Assume ASSET-003 is a database, created similarly)
    
    db.commit()
    print("Demo data seeded successfully with 5 scenarios.")


