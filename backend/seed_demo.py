"""
seed_demo.py
------------
Populates the database with realistic demo data covering 5 core scenarios.
Run with: PYTHONPATH=. python3 -m backend.seed_demo
"""

import uuid
from datetime import datetime, timedelta
from backend.database import SessionLocal
from backend.models import (
    Organization, Asset, BusinessContext, SecurityEvent, Vulnerability,
    SecurityControl, Dependency, SecurityIntelligence, Identity
)

def seed_demo_data():
    db = SessionLocal()
    
    # Prevent double-seeding
    if db.query(Organization).first() is not None:
        print("⚠️  Database already contains data. Skipping seed.")
        db.close()
        return

    print("🌱 Seeding MarkX Demo Data...")

    # 1. Create Organization
    org = Organization(id="ORG-001", name="Acme Corp", industry="Financial Services", size="enterprise")
    db.add(org)

    # =========================================================================
    # SCENARIO 1 & 2: Internet-facing payment server with brute force & critical vuln
    # =========================================================================
    asset1 = Asset(
        id="ASSET-001", organization_id="ORG-001", name="payment-prod-01", hostname="payment-prod-01",
        ip_address="10.0.1.15", asset_type="Server", environment="production",
        internet_exposed=True, owner="DevOps Team", department="Engineering", discovery_source="manual"
    )
    db.add(asset1)
    
    db.add(BusinessContext(
        id=str(uuid.uuid4()), asset_id="ASSET-001", asset_criticality="Critical",
        business_function="Payment Processing", business_owner="CFO", data_sensitivity="Restricted",
        revenue_dependency="High", regulatory_relevance="PCI-DSS", maximum_acceptable_downtime="15 minutes"
    ))
    
    db.add(Vulnerability(
        id="VULN-001", cve="CVE-2024-1234", cvss=9.8, severity="Critical",
        description="Remote Code Execution in legacy web framework", asset_id="ASSET-001",
        affected_software="nginx", affected_version="1.18.0", patch_status="unpatched", source="nvd"
    ))
    
    db.add(SecurityControl(id=str(uuid.uuid4()), name="EDR", asset_id="ASSET-001", status="enabled", configuration_status="compliant"))
    db.add(SecurityControl(id=str(uuid.uuid4()), name="WAF", asset_id="ASSET-001", status="enabled", configuration_status="compliant"))
    db.add(SecurityControl(id=str(uuid.uuid4()), name="MFA", asset_id="ASSET-001", status="disabled", configuration_status="non_compliant"))

    # Generate 47 failed login events (Brute Force)
    event_ids = []
    base_time = datetime.utcnow() - timedelta(hours=2)
    for i in range(47):
        eid = f"EVENT-{1000+i}"
        event_ids.append(eid)
        db.add(SecurityEvent(
            id=eid, source="wazuh", source_event_id=f"wazuh-{i}",
            timestamp=base_time + timedelta(minutes=i),
            event_type="failed_login", severity="Medium",
            source_ip="185.220.101.45", destination_ip="10.0.1.15", destination_port=22,
            asset_id="ASSET-001", username="admin", action="authentication", result="failure",
            detection_rule="5710", mitre_technique="T1110",
            raw_event={"rule_id": 5710, "data": {"srcip": "185.220.101.45", "user": "admin", "location": "Unknown"}}
        ))
        
    # Pre-seed Validated Intelligence for Scenario 1
    db.add(SecurityIntelligence(
        id=str(uuid.uuid4()), asset_id="ASSET-001",
        classification="possible_brute_force", confidence=0.91,
        explanation="47 failed authentication attempts were detected against an administrative account on an internet-facing payment server.",
        mitre_technique="T1110", model="Gemini", model_version="gemini-1.5-flash",
        validation_status="validated", evidence_ids=event_ids[:5]
    ))

    # =========================================================================
    # SCENARIO 5: Amass Discovery (Shadow IT)
    # =========================================================================
    asset2 = Asset(
        id="ASSET-002", organization_id="ORG-001", name="dev-api.example.com", domain="example.com",
        subdomain="dev-api", ip_address="203.0.113.50", asset_type="Subdomain", 
        environment="development", internet_exposed=True, owner="Unassigned", discovery_source="owasp_amass"
    )
    db.add(asset2)
    
    db.add(SecurityIntelligence(
        id=str(uuid.uuid4()), asset_id="ASSET-002",
        classification="shadow_it_discovery", confidence=0.95,
        explanation="New externally exposed subdomain discovered via authorized attack surface mapping. No business context or owner assigned.",
        mitre_technique="Unknown", model="RuleBasedFallback", model_version="1.0",
        validation_status="fallback", evidence_ids=["AMASS-DISC-001"]
    ))

    # =========================================================================
    # SCENARIO 3: Suspicious Cloud Activity
    # =========================================================================
    asset3 = Asset(
        id="ASSET-003", organization_id="ORG-001", name="prod-customer-db-s3", 
        cloud_provider="aws", cloud_account="123456789012", cloud_region="us-east-1",
        asset_type="Storage", environment="production", internet_exposed=False, 
        owner="Cloud Team", department="Engineering", discovery_source="cloud"
    )
    db.add(asset3)
    
    db.add(SecurityEvent(
        id="EVENT-2001", source="cloudtrail", event_type="s3_public_access_changed",
        severity="High", asset_id="ASSET-003", username="deploy-bot", action="PutBucketPublicAccessBlock",
        result="success", mitre_technique="T1562",
        raw_event={"eventSource": "s3.amazonaws.com", "eventName": "PutBucketPublicAccessBlock", "userIdentity": {"type": "IAMUser", "userName": "deploy-bot"}}
    ))

    # =========================================================================
    # SCENARIO 4: Compromised Endpoint
    # =========================================================================
    asset4 = Asset(
        id="ASSET-004", organization_id="ORG-001", name="fin-laptop-042", hostname="fin-laptop-042",
        ip_address="10.0.5.42", asset_type="Workstation", operating_system="Windows 11",
        environment="production", internet_exposed=False, owner="Jane Smith", department="Finance", discovery_source="wazuh"
    )
    db.add(asset4)
    
    db.add(SecurityEvent(
        id="EVENT-3001", source="wazuh", event_type="suspicious_process", severity="Critical",
        asset_id="ASSET-004", username="jsmith", process="powershell.exe",
        command="powershell -enc SQBFAFgA...", action="execution", result="success",
        mitre_technique="T1059.001",
        raw_event={"rule_id": 100010, "data": {"user": "jsmith", "process": "powershell.exe", "command": "powershell -enc..."}}
    ))

    # =========================================================================
    # DEPENDENCIES & BULK DATA
    # =========================================================================
    # Dependency: Payment Server depends on Payment Database
    asset5 = Asset(id="ASSET-005", organization_id="ORG-001", name="payment-db-01", asset_type="Database", environment="production", owner="DBA Team")
    db.add(asset5)
    db.add(Dependency(id=str(uuid.uuid4()), source_asset_id="ASSET-001", target_asset_id="ASSET-005", relationship_type="depends_on"))

    # Generate bulk assets to reach ~50
    for i in range(6, 55):
        db.add(Asset(
            id=f"ASSET-{i:03d}", organization_id="ORG-001", name=f"internal-srv-{i:02d}", 
            asset_type="Server", environment="production", discovery_source="wazuh"
        ))
        # Add a few random low-severity events
        if i % 3 == 0:
            db.add(SecurityEvent(
                id=f"EVENT-{4000+i}", source="wazuh", event_type="process_execution", severity="Low",
                asset_id=f"ASSET-{i:03d}", username="system", action="execution", result="success",
                raw_event={"rule_id": 1002, "data": {"process": "cron"}}
            ))

    db.commit()
    print("✅ Demo data seeded successfully!")
    print(f"   - 1 Organization")
    print(f"   - 54 Assets (including 5 core scenarios)")
    print(f"   - 60+ Security Events")
    print(f"   - 1 Critical Vulnerability")
    print(f"   - 2 Security Intelligence records")
    print(f"   - 1 Dependency relationship")
    db.close()

if __name__ == "__main__":
    seed_demo_data()

