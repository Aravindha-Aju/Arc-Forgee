from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class SecurityContextOutput(BaseModel):
    asset: Dict[str, Any]
    business_context: Optional[Dict[str, Any]]
    security_context: Dict[str, List[Any]] # events, vulnerabilities, threats, identities, controls
    dependencies: List[Dict[str, str]]
    intelligence: List[Dict[str, Any]]
    evidence: List[Dict[str, Any]]

