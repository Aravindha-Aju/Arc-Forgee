import os
import uuid
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from backend.ingestion.csv_parser import parse_and_ingest_csv
from backend.database import SessionLocal
from backend.models import SecurityEvent, Asset, BusinessContext, SecurityControl, SecurityIntelligence
from backend.ai.gemini.service import generate_intelligence
from backend.integration.block2_client import notify_risk_engine

router = APIRouter()
USE_MOCK = os.getenv("MOCK_AI", "false").lower() == "true"

@router.post("/upload/csv")
async def upload_csv(file: UploadFile = File(...), file_type: str = Form(...)):
    content = await file.read()
    text_content = content.decode("utf-8")
    result = parse_and_ingest_csv(text_content, file_type)
    
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "Unknown error"))
    
    ai_intelligence_results = []
    block2_updates = []
    human_readable_translations = []

    if file_type == 'events' and result["records_added"] > 0:
        db = SessionLocal()
        try:
            new_events = db.query(SecurityEvent).filter(SecurityEvent.source == "csv_upload").all()
            unique_asset_ids = list(set(e.asset_id for e in new_events if e.asset_id))
            
            for asset_id in unique_asset_ids:
                asset = db.query(Asset).filter(Asset.id == asset_id).first()
                if not asset: continue
                
                events = db.query(SecurityEvent).filter(SecurityEvent.asset_id == asset_id).order_by(SecurityEvent.timestamp.desc()).limit(50).all()
                controls = db.query(SecurityControl).filter(SecurityControl.asset_id == asset_id).all()
                biz_ctx = db.query(BusinessContext).filter(BusinessContext.asset_id == asset_id).first()
                
                event_ids = [e.id for e in events][:10]
                
                valid_records_for_ai = [{
                    "timestamp": str(e.timestamp),
                    "event_type": e.event_type,
                    "severity": e.severity,
                    "source_ip": e.source_ip,
                    "destination_ip": e.destination_ip,
                    "username": e.username,
                    "action": e.action,
                    "result": e.result
                } for e in events]
                
                structured_evidence = {
                    "asset_name": asset.name,
                    "asset_type": asset.asset_type,
                    "internet_exposed": asset.internet_exposed,
                    "business_criticality": biz_ctx.asset_criticality if biz_ctx else "Unknown",
                    "mfa_status": next((c.status for c in controls if c.name == "MFA"), "unknown"),
                    "valid_records": valid_records_for_ai,
                    "event_ids": event_ids
                }
                
                ai_response = generate_intelligence(db, asset_id, structured_evidence)
                
                # FAIL-CLOSED: Only save and display if it's an actual finding
                if ai_response.get("classification") != "NO_ACTIONABLE_FINDING":
                    intel_record = SecurityIntelligence(
                        id=str(uuid.uuid4()), asset_id=asset_id,
                        classification=ai_response.get("classification", "unknown"),
                        confidence=ai_response.get("confidence", 0.5),
                        explanation=ai_response.get("explanation", "No explanation provided."),
                        mitre_technique=ai_response.get("mitre_technique", "N/A"),
                        model="Mock_AI" if USE_MOCK else "gemini-flash-latest",
                        model_version="1.0" if USE_MOCK else "latest",
                        validation_status="validated",
                        evidence_ids=ai_response.get("evidence", [])
                    )
                    db.add(intel_record)
                    db.commit()
                    
                    # Notify Block 2 Risk Engine for real-time risk update
                    try:
                        import asyncio
                        loop = asyncio.get_event_loop()
                        if loop.is_running():
                            import concurrent.futures
                            with concurrent.futures.ThreadPoolExecutor() as pool:
                                b2_result = pool.submit(
                                    asyncio.run,
                                    notify_risk_engine(
                                        asset_id=asset_id,
                                        classification=intel_record.classification,
                                        confidence=intel_record.confidence,
                                        mitre_technique=intel_record.mitre_technique,
                                        evidence_ids=intel_record.evidence_ids or []
                                    )
                                ).result()
                        else:
                            b2_result = asyncio.run(notify_risk_engine(
                                asset_id=asset_id,
                                classification=intel_record.classification,
                                confidence=intel_record.confidence,
                                mitre_technique=intel_record.mitre_technique,
                                evidence_ids=intel_record.evidence_ids or []
                            ))
                        block2_updates.append({
                            "asset_id": asset_id,
                            "asset_name": asset.name,
                            "status": b2_result.get("status"),
                            "old_score": b2_result.get("old_score"),
                            "new_score": b2_result.get("new_score"),
                            "ale": b2_result.get("ale")
                        })
                    except Exception as e:
                        print(f"Block 2 integration warning: {e}")
                        block2_updates.append({
                            "asset_id": asset_id,
                            "asset_name": asset.name,
                            "status": "failed",
                            "reason": str(e)
                        })
                    
                    ai_intelligence_results.append({
                        "asset": asset.name,
                        "classification": intel_record.classification,
                        "explanation": intel_record.explanation,
                        "confidence": intel_record.confidence,
                        "mitre_technique": intel_record.mitre_technique,
                        "validation_status": intel_record.validation_status
                    })

            # Executive Briefing (Plain English with EXACT counts)
            if USE_MOCK:
                human_readable_translations = [
                    "• Exactly 1 high-severity failed login attempt was blocked from an external IP address targeting the server.",
                    "• Exactly 1 critical malware execution attempt was detected and successfully blocked by the endpoint protection system."
                ]
            else:
                import google.generativeai as genai
                genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
                translator_model = genai.GenerativeModel('gemini-flash-latest')
                logs_text = "\n".join([f"- Event: {e.event_type}, Severity: {e.severity}, Source IP: {e.source_ip}, Target: {e.destination_ip}, User: {e.username}, Action: {e.action}, Result: {e.result}" for e in new_events[-10:]])
                prompt = f"Translate these raw security log entries into clear, plain English bullet points for a non-technical CEO. You MUST use EXACT counts (e.g., 'Exactly 3 failed logins'). Respect 'blocked' vs 'allowed'. Do not invent threats.\n\n{logs_text}"
                try:
                    response = translator_model.generate_content(prompt, request_options={"timeout": 15})
                    human_readable_translations = [line.strip() for line in response.text.split('\n') if line.strip().startswith('•') or line.strip().startswith('-') or line.strip().startswith('Exactly') or line.strip().startswith('No ')]
                except Exception:
                    human_readable_translations = ["AI translation skipped due to network timeout. Raw logs ingested successfully."]

        except Exception as e:
            print(f"Processing Error: {e}")
        finally:
            db.close()

    return {
        "message": f"Successfully ingested {result['records_added']} records.",
        "errors": result.get("errors", []),
        "ai_intelligence_generated": ai_intelligence_results,
        "human_readable_translations": human_readable_translations,
        "block2_risk_updates": block2_updates
    }
