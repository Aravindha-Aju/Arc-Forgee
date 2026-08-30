import os
import json
from backend.database import SessionLocal
from backend.ai.gemini.schemas import GeminiIntelligenceResponse

USE_MOCK = os.getenv("MOCK_AI", "false").lower() == "true"

MASTER_PROMPT = """# MASTER PROMPT — GROUNDED CYBERSECURITY LOG ANALYSIS ENGINE

You are a strict, evidence-based cybersecurity log analysis engine.
Your job is to analyze the security logs provided in the CURRENT REQUEST and produce an accurate ingestion result, executive briefing, and threat intelligence report.

## 🔴 ABSOLUTE RULE
**CURRENT INPUT IS THE ONLY SOURCE OF TRUTH.**
Ignore all previous examples, requests, responses, findings, assets, counts, briefings, IPs, and conclusions. Treat every request as a completely new analysis.

# 1. DATA ISOLATION
Only use information explicitly present in the CURRENT REQUEST. You MUST NOT invent assets, counts, events, IPs, usernames, timestamps, attack patterns, or compromises. If information cannot be proven from the current input: DO NOT OUTPUT IT. When uncertain: FAIL CLOSED.

# 2. CURRENT DATA RESET
Logically reset all previous state. 
CURRENT_RECORDS = current request only
CURRENT_VALID_RECORDS = validated current records only
CURRENT_ASSETS = unique asset_name values from CURRENT_VALID_RECORDS
CURRENT_FINDINGS = empty

# 3. CSV INGESTION & VALIDATION
First line is header. Every following line is one data record. Count data records only. Never count the header.
Required fields: timestamp (valid ISO-8601), event_type, severity, source_ip (valid IPv4/IPv6), destination_ip (valid IPv4/IPv6), asset_name, username, action, result.
If a required field is missing or invalid, reject the record.

# 4. INGESTION CALCULATION
Calculate exactly: SUCCESSFULLY_INGESTED = TOTAL_DATA_ROWS - INVALID_ROWS. Never estimate, round, or guess.

# 5. INVALID RECORDS MUST BE COMPLETELY EXCLUDED
A rejected record must not participate in any later processing (asset detection, correlation, threat intelligence, briefing, MITRE, confidence, counts). Treat rejected records as nonexistent.

# 6. EXACT ASSET & EVENT CONTROL
Every asset and event mentioned in the output MUST exist in CURRENT_VALID_RECORDS. If there are 4 failed_login events, you MUST say "4 failed authentication attempts." You MUST NOT say "17", "many", or estimate. Calculate all numeric quantities directly from current records.

# 7. EVENT CORRELATION & THREAT LOGIC
- BRUTE FORCE: Do NOT classify every failed login as brute force. A single failed login is NOT sufficient. Strong evidence requires multiple failed_login events, same source/target, short time period.
- SUCCESS AFTER FAILED: Multiple failed logins followed by successful login may indicate possible credential compromise (T1078). Use "may indicate" or "consistent with".
- MALWARE: If result = blocked, say "detected and blocked." Do NOT say "infected" unless proven.
- PORT SCANNING: Repeated port_scan supports NETWORK RECONNAISSANCE (T1046). Do not call it brute force.
- DATA EXFILTRATION: If blocked, say "attempted transfer was detected and blocked." Do NOT say data was stolen.
- NORMAL ACTIVITY: Do NOT call an asset "ROUTINE" if it contains malware, privilege escalation, scanning, exfiltration, or critical events. Omit the asset if no meaningful intelligence exists.

# 8. MULTIPLE FINDINGS & FALLBACK
Never force exactly one finding per asset. Multiple independent findings are allowed. Do NOT generate findings to fill the report. If insufficient evidence: output "NO ACTIONABLE FINDING" or omit the asset. FALLBACK must NEVER mean "POSSIBLE BRUTE FORCE".

# 9. MITRE ATT&CK & CONFIDENCE
MITRE techniques must be based on actual evidence (e.g., T1110 for repeated auth failures, T1046 for scanning). If unsupported: MITRE: N/A.
Confidence must depend on actual evidence (number of events, repetition, time proximity, severity, result). Never use a fixed confidence value (like 92%).

# 10. EXECUTIVE BRIEFING
Generate from CURRENT_VALID_RECORDS only. Respect result status (blocked = prevented). Do not exaggerate or invent counts.

# 11. FINAL HALLUCINATION CHECK
Before outputting, verify: ASSET EXISTS? EVENT EXISTS? COUNT MATCHES? THREAT SUPPORTED? If NO to any, DELETE the finding. Accuracy is more important than completeness.

CURRENT VALID RECORDS TO ANALYZE:
{current_records_json}

Return ONLY a valid JSON object matching this schema:
{
  "classification": "string (e.g., possible_brute_force, network_reconnaissance, malware_attempt, or NO_ACTIONABLE_FINDING)",
  "confidence": float (0.0 to 1.0, evidence-based),
  "explanation": "string (MUST include EXACT counts, e.g., 'Exactly 4 failed authentication attempts', and respect 'blocked' vs 'allowed')",
  "mitre_technique": "string (e.g., T1110, T1046, T1204, or N/A)",
  "evidence": ["string"] (list of event_ids from the input that support this)
}
"""

def generate_intelligence(db: SessionLocal, asset_id: str, structured_evidence: dict) -> dict:
    if USE_MOCK:
        events = structured_evidence.get("valid_records", [])
        event_ids = structured_evidence.get("event_ids", [])
        asset_name = structured_evidence.get("asset_name", "Unknown")
        
        failed_logins = [e for e in events if 'failed' in e.get('event_type', '').lower()]
        malware_events = [e for e in events if 'malware' in e.get('event_type', '').lower()]
        port_scans = [e for e in events if 'port_scan' in e.get('event_type', '').lower()]
        
        # BRUTE FORCE GATE: Requires 2+ failed logins, uses EXACT count
        if len(failed_logins) >= 2:
            count = len(failed_logins)
            return {
                "classification": "possible_brute_force",
                "confidence": 0.85,
                "explanation": f"Exactly {count} failed authentication attempts were detected against {asset_name}. This pattern is consistent with credential stuffing or brute force.",
                "mitre_technique": "T1110",
                "evidence": event_ids[:5]
            }
        # MALWARE GATE: Uses EXACT count, respects 'blocked'
        elif len(malware_events) >= 1:
            count = len(malware_events)
            blocked = any(e.get('result') == 'blocked' for e in malware_events)
            status = "detected and blocked" if blocked else "detected"
            return {
                "classification": "malware_attempt",
                "confidence": 0.95,
                "explanation": f"Exactly {count} malware execution attempt(s) were {status} on {asset_name}.",
                "mitre_technique": "T1204",
                "evidence": event_ids[:5]
            }
        # PORT SCAN GATE: Uses EXACT count
        elif len(port_scans) >= 1:
            count = len(port_scans)
            return {
                "classification": "network_reconnaissance",
                "confidence": 0.75,
                "explanation": f"Exactly {count} network port scanning event(s) were detected targeting {asset_name}.",
                "mitre_technique": "T1046",
                "evidence": event_ids[:5]
            }
        # FAIL-CLOSED: NO ACTIONABLE FINDING
        else:
            return {
                "classification": "NO_ACTIONABLE_FINDING",
                "confidence": 0.99,
                "explanation": "Insufficient evidence to generate a threat finding based on current valid records.",
                "mitre_technique": "N/A",
                "evidence": []
            }

    import google.generativeai as genai
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    model = genai.GenerativeModel('gemini-flash-latest')
    
    try:
        prompt = MASTER_PROMPT.format(current_records_json=json.dumps(structured_evidence.get("valid_records", []), indent=2))
        response = model.generate_content(prompt, request_options={"timeout": 15})
        text = response.text
        if "```json" in text: text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text: text = text.split("```")[1].split("```")[0].strip()
            
        parsed_response = json.loads(text)
        validated = GeminiIntelligenceResponse(**parsed_response)
        return validated.model_dump()
        
    except Exception as e:
        return {
            "classification": "NO_ACTIONABLE_FINDING",
            "confidence": 0.1,
            "explanation": f"AI analysis encountered a network error: {str(e)}. Manual review recommended.",
            "mitre_technique": "N/A",
            "evidence": []
        }
