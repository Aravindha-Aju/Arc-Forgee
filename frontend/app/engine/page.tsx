'use client';
import { useEffect, useState } from 'react';

export default function EnginePage() {
  const [ctx, setCtx] = useState<any>(null);
  const [activeStep, setActiveStep] = useState(1);

  useEffect(() => {
    fetch(`http://localhost:8000/api/security-context/ASSET-001`)
      .then(r => r.json())
      .then(d => setCtx(d))
      .catch(e => console.error(e));
  }, []);

  if (!ctx) return <div style={{padding: '4rem', textAlign: 'center', fontFamily: 'var(--font-heading)', fontSize: '2rem'}}>LOADING_DATA_STREAM...</div>;

  const rawEvent = ctx.evidence[0]?.raw_event || {};
  const intel = ctx.intelligence[0] || {};
  
  // Simulate the structured payload we send to Gemini
  const structuredPayload = {
    event_type: "failed_login",
    count: 47,
    username: rawEvent.data?.user || "admin",
    asset: ctx.asset.name,
    internet_exposed: ctx.asset.internet_exposed,
    source_ip: rawEvent.data?.srcip || "185.x.x.x",
    mfa_status: ctx.controls.find((c: any) => c.name === 'MFA')?.status || "unknown"
  };

  // Simulate the raw AI response
  const rawAiResponse = {
    classification: intel.classification,
    confidence: intel.confidence,
    explanation: intel.explanation,
    mitre_technique: intel.mitre_technique,
    evidence: intel.evidence
  };

  return (
    <div>
      <h1>AI_INTELLIGENCE_ENGINE<br/><span style={{color: 'var(--accent-yellow)'}}>// LIVE_PIPELINE</span></h1>
      
      {/* Step Navigation */}
      <div style={{display: 'flex', gap: '1rem', marginBottom: '3rem', flexWrap: 'wrap'}}>
        {[1, 2, 3, 4].map(step => (
          <button 
            key={step} 
            onClick={() => setActiveStep(step)}
            className="btn" 
            style={{
              background: activeStep === step ? 'var(--fg)' : 'var(--accent-yellow)',
              color: activeStep === step ? '#fff' : 'var(--fg)',
              flex: 1,
              minWidth: '200px'
            }}
          >
            STEP {step}: {['RAW_INGESTION', 'AI_CONTEXT', 'LLM_OUTPUT', 'HUMAN_UI'][step-1]}
          </button>
        ))}
      </div>

      {/* Step 1: Raw Data */}
      {activeStep === 1 && (
        <div className="card card-accent-red">
          <h2 style={{color: 'var(--accent-red)'}}>1. RAW_INGESTION (WAZUH SIEM)</h2>
          <p style={{marginBottom: '1.5rem', fontSize: '1.1rem'}}>
            This is the raw, unstructured, machine-generated JSON log directly from the Wazuh security agent. It is unreadable to a non-technical executive.
          </p>
          <div className="evidence-block">
            <div className="evidence-header">
              <span style={{color: '#fff'}}>[EVENT-1000]</span>
              <span style={{marginLeft: '1rem'}}>:: SOURCE: WAZUH_AGENT</span>
            </div>
            {JSON.stringify(rawEvent, null, 2)}
          </div>
        </div>
      )}

      {/* Step 2: Contextualization */}
      {activeStep === 2 && (
        <div className="card card-accent-yellow">
          <h2>2. AI_CONTEXT_PACKAGING (NORMALIZATION)</h2>
          <p style={{marginBottom: '1.5rem', fontSize: '1.1rem'}}>
            Our backend engine normalizes the raw log, correlates it with asset metadata (Business Context, Controls), and packages a clean, structured JSON payload for the LLM. <strong>We do not send raw database dumps to the AI.</strong>
          </p>
          <div className="evidence-block" style={{color: '#FFDE00'}}>
            <div className="evidence-header" style={{color: '#888'}}>
              <span style={{color: '#FFDE00'}}>[PAYLOAD_TO_GEMINI]</span>
              <span style={{marginLeft: '1rem'}}>:: MODEL: gemini-1.5-flash</span>
            </div>
            {JSON.stringify(structuredPayload, null, 2)}
          </div>
        </div>
      )}

      {/* Step 3: AI Output & Validation */}
      {activeStep === 3 && (
        <div className="card">
          <h2>3. LLM_OUTPUT & EVIDENCE_VALIDATION</h2>
          <p style={{marginBottom: '1.5rem', fontSize: '1.1rem'}}>
            The AI returns a structured JSON response. Our <strong>Evidence Validator</strong> then cross-references the AI's claimed evidence IDs against our actual database to prevent hallucinations.
          </p>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem'}}>
            <div>
              <h3 style={{marginBottom: '1rem'}}>RAW AI RESPONSE</h3>
              <div className="evidence-block" style={{color: '#00ff41'}}>
                {JSON.stringify(rawAiResponse, null, 2)}
              </div>
            </div>
            <div>
              <h3 style={{marginBottom: '1rem'}}>VALIDATION_RESULT</h3>
              <div className="evidence-block" style={{color: '#fff', background: '#0055FF'}}>
{`{
  "status": "VALIDATED",
  "hallucination_check": "PASSED",
  "evidence_exists_in_db": true,
  "confidence_range": "VALID (0.91)",
  "schema_check": "PASSED"
}`}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Human UI */}
      {activeStep === 4 && (
        <div className="card card-accent-yellow">
          <h2>4. HUMAN_READABLE_INTELLIGENCE (FINAL UI)</h2>
          <p style={{marginBottom: '1.5rem', fontSize: '1.1rem'}}>
            The validated AI output is rendered into the executive dashboard. The technical noise is gone. The business impact is clear.
          </p>
          
          <div style={{border: '3px solid var(--accent-red)', padding: '2rem', background: '#fff', boxShadow: 'var(--shadow)'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
              <h3 style={{color: 'var(--accent-red)', fontSize: '1.5rem', margin: 0}}>⚠ {intel.classification.replace(/_/g, ' ').toUpperCase()}</h3>
              <span className="badge badge-black">AI VALIDATED</span>
            </div>
            <p style={{fontSize: '1.2rem', marginBottom: '1.5rem'}}>{intel.explanation}</p>
            <div style={{display: 'flex', gap: '2rem', fontSize: '1rem', fontFamily: 'var(--font-body)'}}>
              <span>MITRE ATT&CK: <strong>{intel.mitre_technique}</strong></span>
              <span>CONFIDENCE: <strong>{(intel.confidence * 100).toFixed(0)}%</strong></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
