from sqlalchemy import Column, Integer, String, Float, ForeignKey, Text
from database import Base

class FinancialProfile(Base):
    __tablename__ = "financial_profiles"
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(String, unique=True, index=True)
    asset_name = Column(String)
    asset_value = Column(Float) # Total monetary value
    exposure_factor = Column(Float) # Percentage lost if compromised (0.0 to 1.0)
    revenue_dependency = Column(String) # Low, Medium, High, Critical
    regulatory_fine_risk = Column(Float) # Potential fine amount

class AssetDependency(Base):
    __tablename__ = "asset_dependencies"
    id = Column(Integer, primary_key=True, index=True)
    source_asset_id = Column(String, index=True) # The asset that depends on another
    target_asset_id = Column(String, index=True) # The asset being depended upon

class RiskAssessment(Base):
    __tablename__ = "risk_assessments"
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(String, unique=True, index=True)
    threat_likelihood = Column(Float) # 0.0 to 1.0 (from Block 1)
    sle = Column(Float) # Single Loss Expectancy
    ale = Column(Float) # Annualized Loss Expectancy
    blast_radius_count = Column(Integer) # Number of dependent assets
    risk_score = Column(Integer) # 0 to 100
    top_mitigation = Column(Text)
    mitigation_roi = Column(Float) # Dollars saved if mitigated
