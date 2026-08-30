"""
Block 2 Integration Client
Sends AI intelligence to the Risk Engine for real-time risk recalculation.
"""
import httpx
import asyncio
from typing import List, Optional

BLOCK2_BASE_URL = "http://localhost:8001"

async def notify_risk_engine(
    asset_id: str,
    classification: str,
    confidence: float,
    mitre_technique: Optional[str] = None,
    evidence_ids: List[str] = None
) -> dict:
    if evidence_ids is None:
        evidence_ids = []
    
    payload = {
        "asset_id": asset_id,
        "classification": classification,
        "confidence": confidence,
        "mitre_technique": mitre_technique or "N/A",
        "evidence_ids": evidence_ids
    }
    
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(
                f"{BLOCK2_BASE_URL}/api/risk/update-from-intel",
                json=payload
            )
            if response.status_code == 200:
                return response.json()
            return {"status": "error", "code": response.status_code}
    except httpx.ConnectError:
        return {"status": "offline", "reason": "Block 2 Risk Engine is not running"}
    except httpx.TimeoutException:
        return {"status": "timeout", "reason": "Block 2 did not respond in time"}
    except Exception as e:
        return {"status": "error", "reason": str(e)}

async def check_block2_health() -> dict:
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            response = await client.get(f"{BLOCK2_BASE_URL}/api/risk/integration-status")
            return {"connected": response.status_code == 200, "data": response.json()}
    except Exception:
        return {"connected": False, "data": None}
