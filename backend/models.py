"""
models.py
---------
SQLAlchemy ORM models for the entire MarkX platform.
Covers Block 1 (Security Intelligence) and Block 2 (Risk Quantification).
"""

from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime,
    ForeignKey, JSON, Text, Index, UniqueConstraint
)
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.database import Base


# ============================================================================
# BLOCK 1: SECURITY INTELLIGENCE & ORGANIZATIONAL CONTEXT
# ============================================================================

class Organization(Base):
    """Top-level organization entity."""
    __tablename__ = "organizations"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    industry = Column(String)
    size = Column(String)  # small, medium, large, enterprise
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    assets = relationship("Asset", back_populates="organization")
    identities = relationship("Identity", back_populates="organization")


class Asset(Base):
    """
    Any IT asset: server, workstation, VM, container, database, API,
    domain, subdomain, cloud resource, network device, etc.
    """
    __tablename__ = "assets"

    id = Column(String, primary_key=True)
    organization_id = Column(String, ForeignKey("organizations.id"))

    # Identification
    name = Column(String, nullable=False)
    hostname = Column(String)
    domain = Column(String)
    subdomain = Column(String)
    ip_address = Column(String)
    mac_address = Column(String)

    # Classification
    asset_type = Column(String)  # Server, Workstation, VM, Container, Database, API, etc.
    operating_system = Column(String)
    software = Column(JSON)  # List of installed software with versions
    environment = Column(String)  # production, staging, dev, test

    # Cloud metadata
    cloud_provider = Column(String)  # aws, azure, gcp
    cloud_account = Column(String)
    cloud_region = Column(String)
    cloud_instance_id = Column(String)

    # Exposure & ownership
    internet_exposed = Column(Boolean, default=False)
    owner = Column(String)
    department = Column(String)
    location = Column(String)
    tags = Column(JSON)  # Flexible metadata tags

    # Discovery tracking
    discovery_source = Column(String)  # wazuh, amass, manual, cloud, nvd
    first_seen = Column(DateTime, default=datetime.utcnow)
    last_seen = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="active")  # active, inactive, decommissioned

    # Relationships
    organization = relationship("Organization", back_populates="assets")
    identifiers = relationship("AssetIdentifier", back_populates="asset", cascade="all, delete-orphan")
    events = relationship("SecurityEvent", back_populates="asset")
    vulnerabilities = relationship("Vulnerability", back_populates="asset")
    threats = relationship("Threat", back_populates="asset")
    identities = relationship("Identity", secondary="asset_identities", back_populates="assets")
    controls = relationship("SecurityControl", back_populates="asset")
    business_context = relationship("BusinessContext", back_populates="asset", uselist=False)
    dependencies_as_source = relationship(
        "Dependency", foreign_keys="[Dependency.source_asset_id]", back_populates="source_asset"
    )
    dependencies_as_target = relationship(
        "Dependency", foreign_keys="[Dependency.target_asset_id]", back_populates="target_asset"
    )
    intelligence = relationship("SecurityIntelligence", back_populates="asset")

    __table_args__ = (
        Index("ix_asset_ip", "ip_address"),
        Index("ix_asset_hostname", "hostname"),
        Index("ix_asset_domain", "domain"),
        Index("ix_asset_type", "asset_type"),
    )


class AssetIdentifier(Base):
    """
    Tracks multiple identifiers for the same asset (hostname, IP, cloud ID, etc.)
    Used by the Asset Resolution Engine for deduplication.
    """
    __tablename__ = "asset_identifiers"

    id = Column(String, primary_key=True)
    asset_id = Column(String, ForeignKey("assets.id"), nullable=False)
    identifier_type = Column(String, nullable=False)  # hostname, ip, mac, cloud_id, domain
    identifier_value = Column(String, nullable=False)
    source = Column(String)
    confidence = Column(String)  # HIGH, MEDIUM, LOW
    first_seen = Column(DateTime, default=datetime.utcnow)
    last_seen = Column(DateTime, default=datetime.utcnow)

    asset = relationship("Asset", back_populates="identifiers")

    __table_args__ = (
        UniqueConstraint("identifier_type", "identifier_value", name="uq_identifier"),
        Index("ix_identifier_value", "identifier_value"),
    )


class SecurityEvent(Base):
    """
    Normalized security event from Wazuh, CloudTrail, firewall, IDS, etc.
    Always preserves the original raw_event for auditability.
    """
    __tablename__ = "security_events"

    id = Column(String, primary_key=True)
    source = Column(String, nullable=False)  # wazuh, cloudtrail, firewall, ids
    source_event_id = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    # Classification
    event_type = Column(String)  # failed_login, successful_login, process_execution, malware_alert
    severity = Column(String)  # Low, Medium, High, Critical
    confidence = Column(Float)

    # Network info
    source_ip = Column(String)
    destination_ip = Column(String)
    source_port = Column(Integer)
    destination_port = Column(Integer)
    protocol = Column(String)

    # Asset & identity linkage
    asset_id = Column(String, ForeignKey("assets.id"), index=True)
    username = Column(String)
    process = Column(String)
    command = Column(String)

    # Action & result
    action = Column(String)
    result = Column(String)  # success, failure, blocked, allowed

    # Detection metadata
    detection_rule = Column(String)
    mitre_technique = Column(String)

    # Data preservation
    raw_event = Column(JSON, nullable=False)  # Immutable original data
    normalized_event = Column(JSON)

    # Relationships
    asset = relationship("Asset", back_populates="events")

    __table_args__ = (
        Index("ix_event_type", "event_type"),
        Index("ix_event_severity", "severity"),
    )


class Vulnerability(Base):
    """Vulnerability record correlated with an asset."""
    __tablename__ = "vulnerabilities"

    id = Column(String, primary_key=True)
    cve = Column(String, index=True)
    cvss = Column(Float)
    severity = Column(String)  # Low, Medium, High, Critical
    description = Column(Text)

    # Affected target
    asset_id = Column(String, ForeignKey("assets.id"), index=True)
    affected_software = Column(String)
    affected_version = Column(String)
    fixed_version = Column(String)

    # Exploit info
    exploit_availability = Column(Boolean, default=False)
    public_exploit = Column(Boolean, default=False)

    # Timeline
    first_published = Column(DateTime)
    last_modified = Column(DateTime)
    detected_at = Column(DateTime, default=datetime.utcnow)
    source = Column(String)  # nvd, scanner, manual

    # Remediation
    patch_status = Column(String, default="unpatched")  # unpatched, patched, mitigated, wont_fix

    # Relationships
    asset = relationship("Asset", back_populates="vulnerabilities")


class Threat(Base):
    """Threat intelligence record correlated with an asset."""
    __tablename__ = "threats"

    id = Column(String, primary_key=True)
    threat_type = Column(String)  # malware, apt, ransomware, brute_force, phishing
    threat_actor = Column(String)
    malware = Column(String)
    campaign = Column(String)

    # Indicators
    ioc_type = Column(String)  # ip, domain, url, hash
    ioc_value = Column(String, index=True)

    # MITRE mapping
    mitre_tactic = Column(String)
    mitre_technique = Column(String)

    # Confidence & source
    confidence = Column(Float)
    source = Column(String)

    # Timeline
    first_seen = Column(DateTime)
    last_seen = Column(DateTime)

    # Asset linkage
    asset_id = Column(String, ForeignKey("assets.id"), index=True)
    asset = relationship("Asset", back_populates="threats")


class Indicator(Base):
    """Standalone threat indicator (IOC) not yet linked to a specific asset."""
    __tablename__ = "indicators"

    id = Column(String, primary_key=True)
    ioc_type = Column(String, nullable=False)  # ip, domain, url, hash
    ioc_value = Column(String, nullable=False, index=True)
    threat_type = Column(String)
    severity = Column(String)
    source = Column(String)
    first_seen = Column(DateTime)
    last_seen = Column(DateTime)
    tags = Column(JSON)

    __table_args__ = (
        UniqueConstraint("ioc_type", "ioc_value", name="uq_ioc"),
    )


class Identity(Base):
    """User or service identity."""
    __tablename__ = "identities"

    id = Column(String, primary_key=True)
    organization_id = Column(String, ForeignKey("organizations.id"))
    username = Column(String, nullable=False, index=True)
    role = Column(String)
    department = Column(String)
    privilege_level = Column(String)  # user, admin, root, service_account
    authentication_method = Column(String)  # password, sso, certificate
    mfa_enabled = Column(Boolean, default=False)
    failed_login_count = Column(Integer, default=0)
    account_status = Column(String, default="active")  # active, disabled, locked
    last_login = Column(DateTime)

    # Relationships
    organization = relationship("Organization", back_populates="identities")
    assets = relationship("Asset", secondary="asset_identities", back_populates="identities")


# Many-to-many: Identity <-> Asset
class AssetIdentity(Base):
    """Association table for Identity <-> Asset relationship."""
    __tablename__ = "asset_identities"

    identity_id = Column(String, ForeignKey("identities.id"), primary_key=True)
    asset_id = Column(String, ForeignKey("assets.id"), primary_key=True)


class SecurityControl(Base):
    """Security control applied to an asset."""
    __tablename__ = "security_controls"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)  # MFA, EDR, WAF, Firewall, IDS, IPS, Backup, Encryption, etc.
    category = Column(String)  # preventive, detective, corrective
    asset_id = Column(String, ForeignKey("assets.id"), index=True)
    status = Column(String, default="unknown")  # enabled, disabled, partial, unknown
    configuration_status = Column(String)  # compliant, non_compliant, unknown
    coverage = Column(Float)  # 0.0 to 1.0
    last_checked = Column(DateTime, default=datetime.utcnow)
    source = Column(String)

    # Relationships
    asset = relationship("Asset", back_populates="controls")


class BusinessProcess(Base):
    """Business process that depends on assets."""
    __tablename__ = "business_processes"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    owner = Column(String)
    department = Column(String)


class BusinessContext(Base):
    """
    Organizational context for an asset.
    MUST be manually configured — never fabricated by AI.
    """
    __tablename__ = "business_context"

    id = Column(String, primary_key=True)
    asset_id = Column(String, ForeignKey("assets.id"), unique=True, nullable=False)

    # Criticality
    asset_criticality = Column(String)  # Critical, High, Medium, Low

    # Business alignment
    business_function = Column(String)
    business_owner = Column(String)
    business_process = Column(String)

    # Data classification
    data_sensitivity = Column(String)  # public, internal, confidential, restricted

    # Dependencies
    revenue_dependency = Column(String)  # high, medium, low
    customer_dependency = Column(String)  # high, medium, low
    regulatory_relevance = Column(String)  # PCI-DSS, HIPAA, GDPR, SOX, etc.

    # Resilience requirements
    availability_requirement = Column(String)  # high, medium, low
    recovery_requirement = Column(String)
    maximum_acceptable_downtime = Column(String)  # e.g., "1 hour", "24 hours"

    # Relationships
    asset = relationship("Asset", back_populates="business_context")


class Dependency(Base):
    """Relationship between two assets (dependency graph)."""
    __tablename__ = "dependencies"

    id = Column(String, primary_key=True)
    source_asset_id = Column(String, ForeignKey("assets.id"), nullable=False)
    target_asset_id = Column(String, ForeignKey("assets.id"), nullable=False)
    relationship_type = Column(String, nullable=False)
    # Types: depends_on, communicates_with, hosts, accesses, stores, serves, connected_to
    confidence = Column(Float, default=1.0)
    discovered_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    source_asset = relationship("Asset", foreign_keys=[source_asset_id], back_populates="dependencies_as_source")
    target_asset = relationship("Asset", foreign_keys=[target_asset_id], back_populates="dependencies_as_target")

    __table_args__ = (
        UniqueConstraint("source_asset_id", "target_asset_id", "relationship_type", name="uq_dependency"),
    )


class Correlation(Base):
    """Generic correlation record between any two entities."""
    __tablename__ = "correlations"

    id = Column(String, primary_key=True)
    entity_type_a = Column(String, nullable=False)  # asset, event, vulnerability, threat, identity
    entity_id_a = Column(String, nullable=False, index=True)
    entity_type_b = Column(String, nullable=False)
    entity_id_b = Column(String, nullable=False, index=True)
    correlation_type = Column(String)
    confidence = Column(Float)
    source = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)


class SecurityIntelligence(Base):
    """
    AI-generated intelligence statement backed by evidence.
    Every record must reference real evidence IDs.
    """
    __tablename__ = "security_intelligence"

    id = Column(String, primary_key=True)
    asset_id = Column(String, ForeignKey("assets.id"), index=True)

    # AI classification
    classification = Column(String, nullable=False)  # possible_brute_force, shadow_it_discovery, etc.
    confidence = Column(Float)  # 0.0 to 1.0
    explanation = Column(Text)
    mitre_technique = Column(String)

    # AI model metadata
    model = Column(String, default="Gemini")
    model_version = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)

    # Validation status
    validation_status = Column(String, default="validated")
    # Values: validated, flagged, rejected, fallback

    # Evidence linkage (list of event IDs)
    evidence_ids = Column(JSON, nullable=False)

    # Relationships
    asset = relationship("Asset", back_populates="intelligence")


class Evidence(Base):
    """Standalone evidence record for audit trail."""
    __tablename__ = "evidence"

    id = Column(String, primary_key=True)
    source = Column(String, nullable=False)
    source_id = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)
    raw_data = Column(JSON, nullable=False)
    normalized_data = Column(JSON)
    confidence = Column(Float, default=1.0)


class DataSource(Base):
    """Registry of external data sources feeding the platform."""
    __tablename__ = "data_sources"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    source_type = Column(String)  # wazuh, amass, nvd, cloudtrail, manual
    configuration = Column(JSON)
    status = Column(String, default="active")
    last_sync = Column(DateTime)


class IngestionRun(Base):
    """Audit log of each ingestion execution."""
    __tablename__ = "ingestion_runs"

    id = Column(String, primary_key=True)
    data_source_id = Column(String, ForeignKey("data_sources.id"))
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
    status = Column(String)  # running, completed, failed
    records_processed = Column(Integer, default=0)
    records_failed = Column(Integer, default=0)
    error_message = Column(Text)


class AuditLog(Base):
    """Immutable audit trail for all important actions."""
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    actor = Column(String)  # system, user, ai
    action = Column(String, nullable=False)  # create, update, delete, ingest, classify
    entity_type = Column(String)
    entity_id = Column(String)
    details = Column(JSON)
    source = Column(String)  # api, ingestion, ai, manual


# ============================================================================
# BLOCK 2: RISK QUANTIFICATION (extends Block 1 models)
# ============================================================================

class QuantifiedRisk(Base):
    """Cached risk calculation result for an asset."""
    __tablename__ = "quantified_risks"

    id = Column(String, primary_key=True)
    asset_id = Column(String, ForeignKey("assets.id"), nullable=False, index=True)
    risk_score = Column(Float, nullable=False)  # 0.0 to 100.0
    risk_level = Column(String, nullable=False)  # LOW, MEDIUM, HIGH, CRITICAL
    likelihood = Column(Float, nullable=False)  # 0.0 to 1.0
    impact = Column(Float, nullable=False)  # 0.0 to 1.0
    financial_exposure = Column(Float, default=0.0)
    key_drivers = Column(JSON)  # List of RiskDriver dicts
    blast_radius = Column(JSON)  # List of downstream asset IDs
    calculated_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("ix_risk_score", "risk_score"),
        Index("ix_risk_level", "risk_level"),
    )


class SecurityAction(Base):
    """Possible remediation action for risk reduction."""
    __tablename__ = "security_actions"

    id = Column(String, primary_key=True)
    action_type = Column(String, nullable=False)  # enable_mfa, patch_vuln, deploy_edr, etc.
    description = Column(Text)
    affected_asset_ids = Column(JSON)  # List of asset IDs
    estimated_cost = Column(Float)  # In currency units
    implementation_effort_hours = Column(Float)
    expected_risk_reduction = Column(Float)  # Points (0-100)
    dependencies = Column(JSON)  # Other action IDs required first
    side_effects = Column(JSON)


class ActionPlan(Base):
    """Optimized set of actions recommended by the platform."""
    __tablename__ = "action_plans"

    id = Column(String, primary_key=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    budget_constraint = Column(Float)
    hours_constraint = Column(Float)
    current_risk = Column(Float)
    projected_risk = Column(Float)
    total_cost = Column(Float)
    total_hours = Column(Float)
    action_ids = Column(JSON)  # List of SecurityAction IDs
    status = Column(String, default="proposed")  # proposed, approved, in_progress, completed


class ActionOutcome(Base):
    """Actual outcome after an action is implemented (Block 4 feedback)."""
    __tablename__ = "action_outcomes"

    id = Column(String, primary_key=True)
    action_plan_id = Column(String, ForeignKey("action_plans.id"))
    action_id = Column(String, ForeignKey("security_actions.id"))
    implemented_at = Column(DateTime)
    risk_before = Column(Float)
    risk_after = Column(Float)
    predicted_reduction = Column(Float)
    actual_reduction = Column(Float)
    effectiveness_rating = Column(String)  # HIGH, MEDIUM, LOW, NEGATIVE
    notes = Column(Text)



