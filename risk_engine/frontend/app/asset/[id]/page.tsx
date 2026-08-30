'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import InteractiveGraph from '../../../components/enhanced/InteractiveGraph';
import HistoricalTrend from '../../../components/enhanced/HistoricalTrend';
import ComparativeAnalysis from '../../../components/enhanced/ComparativeAnalysis';
import ExportPanel from '../../../components/enhanced/ExportPanel';
import WebSocketStatus from '../../../components/enhanced/WebSocketStatus';

export default function AssetRiskPage() {
  const params = useParams();
  const [data, setData] = useState<any>(null);
  
  // Simulator State
  const [activeMitigations, setActiveMitigations] = useState<string[]>([]);
  
  // Modal State
  const [showCalcModal, setShowCalcModal] = useState(false);
  const [showWhyModal, setShowWhyModal] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: string} | null>(null);

  const showNotification = (message: string, type: string = 'success') => {
    setNotification({message, type});
    setTimeout(() => setNotification(null), 4000);
  };

  // Scroll Refs
  const graphRef = useRef<HTMLDivElement>(null);
  const attackPathRef = useRef<HTMLDivElement>(null);
  const simulatorRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  useEffect(() => {
    if (params.id) {
      fetch(`http://localhost:8001/api/asset/${params.id}`)
        .then(r => r.json())
        .then(setData)
        .catch(console.error);
    }
  }, [params.id]);

  if (!data) return <div style={{padding: '4rem', textAlign: 'center', fontFamily: 'var(--font-heading)', fontSize: '2rem'}}>CALCULATING_RISK...</div>;

  const { profile, financials, blast_radius, assessment } = data;

  // Simulator Data & Math
  const mitigationsList = [
    { id: 'net_seg', name: 'Network Segmentation', riskReduction: 15, cost: 80000, aleReduction: 750000 },
    { id: 'acls', name: 'Strict ACLs', riskReduction: 10, cost: 45000, aleReduction: 400000 },
    { id: 'mfa', name: 'Enforce MFA', riskReduction: 10, cost: 35000, aleReduction: 420000 },
    { id: 'waf', name: 'Deploy WAF', riskReduction: 8, cost: 25000, aleReduction: 180000 },
    { id: 'patch', name: 'Patch Critical CVEs', riskReduction: 20, cost: 15000, aleReduction: 1200000 },
  ];

  const activeMitData = mitigationsList.filter(m => activeMitigations.includes(m.id));
  const totalRiskReduction = activeMitData.reduce((sum, m) => sum + m.riskReduction, 0);
  const totalAleReduction = activeMitData.reduce((sum, m) => sum + m.aleReduction, 0);
  const totalCost = activeMitData.reduce((sum, m) => sum + m.cost, 0);
  
  const projectedRisk = Math.max(10, assessment.risk_score - totalRiskReduction);
  const projectedAle = Math.max(100000, financials.ale - totalAleReduction);
  const roi = totalCost > 0 ? Math.round(((totalAleReduction - totalCost) / totalCost) * 100) : 0;

  const toggleMitigation = (id: string) => {
    setActiveMitigations(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  return (
    <div style={{maxWidth: '1400px', margin: '0 auto', padding: '3rem 2rem', fontFamily: 'var(--font-body)'}}>
      
      {/* MODALS */}
      {showCalcModal && (
        <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center'}} onClick={() => setShowCalcModal(false)}>
          <div className="card" style={{maxWidth: '500px', width: '90%'}} onClick={e => e.stopPropagation()}>
            <h2>// RISK_CALCULATION_METHODOLOGY</h2>
            <p style={{marginBottom: '1rem', lineHeight: 1.6}}>The Risk Score (0-100) is a weighted composite of five factors:</p>
            <ul style={{marginLeft: '1.5rem', marginBottom: '1.5rem', lineHeight: 1.8}}>
              <li><strong>Asset Criticality (30%):</strong> Business impact and revenue dependency.</li>
              <li><strong>Vulnerability Severity (25%):</strong> Highest CVSS score of open findings.</li>
              <li><strong>Exploitability (20%):</strong> Availability of public exploits and threat intel.</li>
              <li><strong>Network Exposure (15%):</strong> Internet-facing status and open ports.</li>
              <li><strong>Dependency Impact (10%):</strong> Blast radius and downstream critical assets.</li>
            </ul>
            <button className="btn" onClick={() => setShowCalcModal(false)}>CLOSE</button>
          </div>
        </div>
      )}

      {showWhyModal && (
        <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center'}} onClick={() => setShowWhyModal(false)}>
          <div className="card" style={{maxWidth: '500px', width: '90%'}} onClick={e => e.stopPropagation()}>
            <h2>// AI_ANALYST_REASONING</h2>
            <p style={{marginBottom: '1rem', lineHeight: 1.6}}>The AI recommends <strong>Network Segmentation + Strict ACLs</strong> because:</p>
            <ol style={{marginLeft: '1.5rem', marginBottom: '1.5rem', lineHeight: 1.8}}>
              <li>This asset has the highest financial exposure ($2.5M) in the portfolio.</li>
              <li>It sits at the center of the dependency graph, meaning a compromise cascades to {blast_radius.total_impacted} downstream systems.</li>
              <li>Current network exposure allows lateral movement from the compromised web frontend.</li>
            </ol>
            <p style={{fontSize: '0.9rem', color: '#666', fontStyle: 'italic'}}>This recommendation is based on observed topology and financial modeling, not hypothetical scenarios.</p>
            <button className="btn" style={{marginTop: '1rem'}} onClick={() => setShowWhyModal(false)}>CLOSE</button>
          </div>
        </div>
      )}

      {/* 1. ASSET HEADER */}
      <div style={{marginBottom: '2rem', borderBottom: '4px solid #111', paddingBottom: '1.5rem'}}>
        <div style={{fontSize: '0.8rem', color: '#666', fontFamily: 'var(--font-heading)', letterSpacing: '1px', marginBottom: '0.5rem'}}>MARKX // RISK ENGINE / PORTFOLIO / ASSETS / {profile.asset_id}</div>
        <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: '1rem'}}>
          <div>
            <h1 style={{margin: 0, fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontFamily: 'var(--font-heading)', letterSpacing: '-2px'}}>{profile.asset_name}</h1>
            <p style={{color: '#666', margin: 0}}>Production Payment Processing Infrastructure</p>
          </div>
          <div style={{display: 'flex', gap: '0.5rem'}}>
            <button className="btn" style={{background: '#fff', border: '2px solid #111'}}>Investigate</button>
            <button className="btn" onClick={() => scrollTo(simulatorRef)}>Simulate Mitigation</button>
            <button className="btn" onClick={() => scrollTo(exportRef)} style={{background: 'var(--accent-blue)', color: '#fff', border: '2px solid var(--accent-blue)'}}>Export Report</button>
          </div>
        </div>
        <div style={{display: 'flex', gap: '1.5rem', marginTop: '1rem', fontSize: '0.85rem', fontFamily: 'var(--font-heading)'}}>
          <span style={{color: 'var(--accent-green)'}}>● STATUS: ONLINE</span>
          <span style={{color: 'var(--accent-red)'}}>● RISK: CRITICAL</span>
          <span style={{color: '#666'}}>LAST ASSESSED: 2 MINUTES AGO</span>
          <span style={{color: 'var(--accent-yellow)'}}>TREND: +12 SINCE PREVIOUS</span>
        </div>
      </div>

      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginBottom: '2rem'}}>
        {/* 2. RISK SCORE HERO */}
        <div className="card">
          <h2>Risk Score Composition</h2>
          <div style={{display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '1.5rem'}}>
            <div style={{position: 'relative', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <svg style={{width: '100%', height: '100%', transform: 'rotate(-90deg)'}}>
                <circle cx="60" cy="60" r="50" stroke="#e0e0e0" strokeWidth="8" fill="none" />
                <circle cx="60" cy="60" r="50" stroke={assessment.risk_score > 60 ? 'var(--accent-red)' : 'var(--accent-yellow)'} strokeWidth="8" fill="none" strokeDasharray={`${(assessment.risk_score / 100) * 314} 314`} strokeLinecap="round" />
              </svg>
              <div style={{position: 'absolute', textAlign: 'center'}}>
                <div style={{fontSize: '2.5rem', fontFamily: 'var(--font-heading)', fontWeight: 'bold', color: assessment.risk_score > 60 ? 'var(--accent-red)' : 'var(--accent-yellow)'}}>{assessment.risk_score}</div>
                <div style={{fontSize: '0.8rem', color: '#666'}}>/ 100</div>
              </div>
            </div>
            <div style={{flex: 1}}>
              {[
                { label: 'Asset Criticality', val: 91, color: 'var(--accent-red)' },
                { label: 'Exploitability', val: 74, color: 'var(--accent-yellow)' },
                { label: 'Network Exposure', val: 68, color: 'var(--accent-yellow)' },
                { label: 'Dependency Impact', val: 63, color: 'var(--accent-blue)' },
              ].map((item, i) => (
                <div key={i} style={{marginBottom: '0.5rem'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.2rem'}}>
                    <span style={{color: '#666'}}>{item.label}</span>
                    <span style={{fontWeight: 'bold', color: item.color}}>{item.val}%</span>
                  </div>
                  <div style={{background: '#e0e0e0', height: '8px', border: '1px solid #111'}}>
                    <div style={{background: item.color, width: `${item.val}%`, height: '100%'}}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button className="btn" style={{padding: '0.5rem 1rem', fontSize: '0.8rem', background: '#fff', border: '2px solid #111'}} onClick={() => setShowCalcModal(true)}>
            HOW IS THIS CALCULATED?
          </button>
        </div>

        {/* 3. FINANCIAL EXPOSURE */}
        <div className="card card-blue">
          <h2 style={{color: 'var(--accent-blue)'}}>// FINANCIAL_QUANTIFICATION</h2>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem'}}>
            <div style={{padding: '1rem', background: '#f4f4f4', border: '2px solid #111'}}>
              <div style={{fontSize: '0.75rem', color: '#666', marginBottom: '0.3rem'}}>TOTAL ASSET VALUE</div>
              <div style={{fontSize: '1.5rem', fontFamily: 'var(--font-heading)'}}>{fmt(profile.asset_value)}</div>
            </div>
            <div style={{padding: '1rem', background: '#f4f4f4', border: '2px solid #111'}}>
              <div style={{fontSize: '0.75rem', color: '#666', marginBottom: '0.3rem'}}>EXPOSURE FACTOR</div>
              <div style={{fontSize: '1.5rem', fontFamily: 'var(--font-heading)', color: 'var(--accent-yellow)'}}>{(profile.exposure_factor * 100).toFixed(0)}%</div>
            </div>
            <div style={{padding: '1rem', background: '#f4f4f4', border: '2px solid #111'}}>
              <div style={{fontSize: '0.75rem', color: '#666', marginBottom: '0.3rem'}}>SINGLE LOSS (SLE)</div>
              <div style={{fontSize: '1.5rem', fontFamily: 'var(--font-heading)', color: 'var(--accent-yellow)'}}>{fmt(financials.sle)}</div>
            </div>
            <div style={{padding: '1rem', background: '#fff0f0', border: '2px solid var(--accent-red)'}}>
              <div style={{fontSize: '0.75rem', color: 'var(--accent-red)', marginBottom: '0.3rem'}}>ANNUALIZED LOSS (ALE)</div>
              <div style={{fontSize: '1.5rem', fontFamily: 'var(--font-heading)', color: 'var(--accent-red)'}}>{fmt(financials.ale)} / YR</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. EXPLAINABLE RISK FACTORS */}
      <div className="card" style={{marginBottom: '2rem'}}>
        <h2>// WHY_IS_THIS_RISK_HIGH?</h2>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem'}}>
          {[
            { level: 'CRITICAL', text: 'Internet-facing production payment system' },
            { level: 'HIGH', text: 'High business criticality & regulatory exposure' },
            { level: 'HIGH', text: '3 exploitable vulnerabilities (CVSS > 8.0)' },
            { level: 'HIGH', text: `Connected to ${blast_radius.total_impacted} dependent assets` },
          ].map((item, i) => (
            <div key={i} style={{display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: '#f4f4f4', border: '2px solid #111'}}>
              <span className="badge" style={{background: item.level === 'CRITICAL' ? 'var(--accent-red)' : 'var(--accent-yellow)', color: '#fff', border: 'none'}}>{item.level}</span>
              <span style={{fontSize: '0.9rem'}}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 5. BLAST RADIUS TOPOLOGY */}
      <div className="card" style={{marginBottom: '2rem'}} ref={graphRef}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
          <h2>// BLAST_RADIUS_TOPOLOGY</h2>
          <button className="btn" style={{padding: '0.5rem 1rem', fontSize: '0.8rem'}} onClick={() => scrollTo(graphRef)}>
            ANALYZE BLAST RADIUS →
          </button>
        </div>
        <p className="label" style={{marginBottom: '1.5rem'}}>
          If this asset is compromised, the following {blast_radius.total_impacted} dependent asset(s) are immediately at risk.
        </p>
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem'}}>
          {blast_radius.upstream.length > 0 && (
            <>
              <div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center'}}>
                {blast_radius.upstream.map((id: string, i: number) => (
                  <div key={i} className="blast-node high">DEPENDS_ON: {id}</div>
                ))}
              </div>
              <div className="blast-arrow">⬇</div>
            </>
          )}
          <div className="blast-node critical" style={{fontSize: '1.5rem', padding: '1.5rem 3rem'}}>{profile.asset_name}</div>
          {blast_radius.downstream.length > 0 && (
            <>
              <div className="blast-arrow">⬇</div>
              <div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center'}}>
                {blast_radius.downstream.map((id: string, i: number) => (
                  <div key={i} className="blast-node critical">IMPACTED: {id}</div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 6. ATTACK PATH */}
      <div className="card card-yellow" style={{marginBottom: '2rem'}} ref={attackPathRef}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
          <h2 style={{color: 'var(--accent-yellow)'}}>// MOST_LIKELY_ATTACK_PATH</h2>
          <button className="btn" style={{padding: '0.5rem 1rem', fontSize: '0.8rem', background: 'var(--accent-yellow)'}} onClick={() => scrollTo(attackPathRef)}>
            TRACE PATH →
          </button>
        </div>
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1rem 0'}}>
          {[
            { name: 'Internet', risk: 'EXTERNAL', color: '#666' },
            { name: 'Public API', risk: 'CVE-2024-1234', color: 'var(--accent-red)' },
            { name: 'Payment API', risk: 'Lateral Movement', color: 'var(--accent-yellow)' },
            { name: 'Production DB', risk: 'Data Access', color: 'var(--accent-red)' },
          ].map((stage, i) => (
            <div key={i} style={{textAlign: 'center'}}>
              <div style={{padding: '1rem 2rem', border: `3px solid ${stage.color}`, background: '#fff', fontWeight: 'bold', boxShadow: '4px 4px 0 #111', minWidth: '200px'}}>
                <div style={{fontSize: '1.1rem'}}>{stage.name}</div>
                <div style={{fontSize: '0.75rem', color: stage.color, fontFamily: 'var(--font-body)', marginTop: '0.3rem'}}>{stage.risk}</div>
              </div>
              {i < 3 && <div style={{fontSize: '2rem', color: '#111', margin: '0.5rem 0'}}>↓</div>}
            </div>
          ))}
        </div>
      </div>

      {/* 7. MITIGATION WHAT-IF SIMULATOR */}
      <div className="card" style={{marginBottom: '2rem', border: '4px solid var(--accent-blue)', boxShadow: '8px 8px 0 var(--accent-blue)'}} ref={simulatorRef}>
        <h2 style={{color: 'var(--accent-blue)'}}>// WHAT_IF? — MITIGATION SIMULATOR</h2>
        <p className="label" style={{marginBottom: '1.5rem'}}>Toggle controls to see projected risk reduction (modeled estimates)</p>
        
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginBottom: '2rem'}}>
          <div>
            <div style={{marginBottom: '1rem', fontWeight: 'bold', fontSize: '0.9rem'}}>AVAILABLE CONTROLS:</div>
            {mitigationsList.map((control) => (
              <label key={control.id} style={{display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.8rem', border: '2px solid #111', marginBottom: '0.5rem', cursor: 'pointer', background: activeMitigations.includes(control.id) ? '#f0fff0' : '#fff', transition: 'all 0.2s'}}>
                <input type="checkbox" checked={activeMitigations.includes(control.id)} onChange={() => toggleMitigation(control.id)} style={{width: '20px', height: '20px', cursor: 'pointer'}} />
                <div style={{flex: 1}}>
                  <div style={{fontWeight: 'bold'}}>{control.name}</div>
                  <div style={{fontSize: '0.75rem', color: '#666'}}>Reduces risk by {control.riskReduction} pts • Cost: {fmt(control.cost)}</div>
                </div>
              </label>
            ))}
          </div>
          
          <div style={{background: '#f4f4f4', padding: '1.5rem', border: '3px solid #111'}}>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem'}}>
              <div style={{textAlign: 'center', padding: '1rem', background: '#fff', border: '2px solid var(--accent-red)'}}>
                <div className="label">CURRENT RISK</div>
                <div style={{fontSize: '2.5rem', fontFamily: 'var(--font-heading)', color: 'var(--accent-red)'}}>{assessment.risk_score}</div>
              </div>
              <div style={{textAlign: 'center', padding: '1rem', background: '#fff', border: '2px solid var(--accent-green)'}}>
                <div className="label">PROJECTED RISK</div>
                <div style={{fontSize: '2.5rem', fontFamily: 'var(--font-heading)', color: 'var(--accent-green)'}}>{projectedRisk}</div>
              </div>
            </div>
            
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem'}}>
              <div style={{textAlign: 'center', padding: '1rem', background: '#fff', border: '2px solid var(--accent-red)'}}>
                <div className="label">CURRENT ALE</div>
                <div style={{fontSize: '1.2rem', fontFamily: 'var(--font-heading)', color: 'var(--accent-red)'}}>{fmt(financials.ale)}</div>
              </div>
              <div style={{textAlign: 'center', padding: '1rem', background: '#fff', border: '2px solid var(--accent-green)'}}>
                <div className="label">PROJECTED ALE</div>
                <div style={{fontSize: '1.2rem', fontFamily: 'var(--font-heading)', color: 'var(--accent-green)'}}>{fmt(projectedAle)}</div>
              </div>
            </div>
            
            <div style={{padding: '1rem', background: '#fff', border: '3px solid var(--accent-blue)', textAlign: 'center', marginBottom: '1rem'}}>
              <div className="label">EXPECTED REDUCTION</div>
              <div style={{fontSize: '1.8rem', fontFamily: 'var(--font-heading)', color: 'var(--accent-blue)'}}>{fmt(totalAleReduction)} / YEAR</div>
            </div>
            
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
              <div style={{padding: '0.8rem', background: '#fff', border: '2px solid #111', textAlign: 'center'}}>
                <div className="label">IMPLEMENTATION COST</div>
                <div style={{fontSize: '1.2rem', fontFamily: 'var(--font-heading)'}}>{fmt(totalCost)}</div>
              </div>
              <div style={{padding: '0.8rem', background: '#fff', border: '2px solid var(--accent-green)', textAlign: 'center'}}>
                <div className="label">ESTIMATED ROI</div>
                <div style={{fontSize: '1.2rem', fontFamily: 'var(--font-heading)', color: 'var(--accent-green)'}}>{roi}%</div>
              </div>
            </div>
          </div>
        </div>
        
        <div style={{display: 'flex', gap: '1rem'}}>
          <button className="btn" style={{flex: 1, background: 'var(--accent-blue)', color: '#fff', border: '2px solid var(--accent-blue)'}} onClick={() => showNotification(`Simulation applied: Risk reduced from ${assessment.risk_score} to ${projectedRisk}. ALE reduced by ${fmt(totalAleReduction)}/yr.`, 'success')}>
            APPLY SIMULATION
          </button>
          <button className="btn" style={{flex: 1, background: '#fff', border: '2px solid #111'}} onClick={() => setActiveMitigations([])}>
            RESET
          </button>
        </div>
      </div>

      {/* 8. MARKX AI ANALYST */}
      <div className="card" style={{marginBottom: '2rem', border: '4px solid var(--accent-blue)', boxShadow: '8px 8px 0 var(--accent-blue)'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem'}}>
          <div style={{width: '50px', height: '50px', background: 'var(--accent-blue)', border: '3px solid #111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem'}}>🧠</div>
          <div>
            <h2 style={{color: 'var(--accent-blue)', margin: 0}}>// MARKX_AI_ANALYST</h2>
            <div style={{fontSize: '0.8rem', color: '#666'}}>Intelligent risk analysis and recommendations</div>
          </div>
        </div>
        
        <div style={{background: '#f4f4f4', padding: '1.5rem', border: '3px solid #111', marginBottom: '1.5rem', lineHeight: 1.6}}>
          <p style={{fontSize: '1.05rem', marginBottom: '1rem'}}><strong>{profile.asset_name.toUpperCase()}</strong> represents the <span style={{color: 'var(--accent-red)', fontWeight: 'bold'}}>highest financial exposure</span> in the current portfolio.</p>
          <p style={{fontSize: '1rem', marginBottom: '1rem'}}><strong>Primary concern:</strong> Insufficient network segmentation combined with multiple downstream dependencies, creating a high-value attack path.</p>
          <p style={{fontSize: '1rem'}}><strong>Recommended priority:</strong> Network segmentation + strict ACLs to reduce blast radius.</p>
        </div>
        
        <div style={{display: 'flex', gap: '1rem'}}>
          <button className="btn" style={{flex: 1, background: '#fff', border: '2px solid #111'}} onClick={() => setShowWhyModal(true)}>WHY?</button>
          <button className="btn" style={{flex: 1, background: 'var(--accent-yellow)'}} onClick={() => scrollTo(simulatorRef)}>SIMULATE</button>
          <button className="btn" style={{flex: 1, background: 'var(--accent-blue)', color: '#fff', border: '2px solid var(--accent-blue)'}} onClick={() => scrollTo(exportRef)}>REPORT</button>
        </div>
      </div>

      {/* 9. ENHANCEMENTS: Interactive Graph, History, Comparison, Export */}
      <div ref={graphRef}>
        <InteractiveGraph assetId={profile.asset_id} assetName={profile.asset_name} upstream={blast_radius.upstream} downstream={blast_radius.downstream} riskScore={assessment.risk_score} />
      </div>
      
      <HistoricalTrend assetId={profile.asset_id} />
      <ComparativeAnalysis assetId={profile.asset_id} riskScore={assessment.risk_score} ale={financials.ale} blastRadius={blast_radius.total_impacted} />
      
      <div ref={exportRef}>
        <ExportPanel assetId={profile.asset_id} assetName={profile.asset_name} />
      </div>

      {/* IN-APP NOTIFICATION */}
      {notification && (
        <div style={{
          position: 'fixed',
          bottom: '4.5rem',
          right: '1rem',
          maxWidth: '420px',
          padding: '1rem 1.5rem',
          background: notification.type === 'success' ? '#000' : 'var(--accent-red)',
          color: '#fff',
          border: '3px solid ' + (notification.type === 'success' ? 'var(--accent-green)' : 'var(--accent-red)'),
          boxShadow: '6px 6px 0 ' + (notification.type === 'success' ? 'var(--accent-green)' : 'var(--accent-red)'),
          fontFamily: 'var(--font-body)',
          fontSize: '0.85rem',
          zIndex: 1001,
          animation: 'slideIn 0.3s ease-out',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.8rem',
          lineHeight: 1.5
        }}>
          <span style={{fontSize: '1.2rem', flexShrink: 0}}>{notification.type === 'success' ? '✅' : '⚠️'}</span>
          <div style={{flex: 1}}>
            <div style={{fontFamily: 'var(--font-heading)', fontSize: '0.75rem', marginBottom: '0.3rem', color: notification.type === 'success' ? 'var(--accent-green)' : 'var(--accent-yellow)', letterSpacing: '1px'}}>
              {notification.type === 'success' ? 'SIMULATION_APPLIED' : 'WARNING'}
            </div>
            <div>{notification.message}</div>
          </div>
          <button onClick={() => setNotification(null)} style={{background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '1.2rem', padding: 0, lineHeight: 1, flexShrink: 0}}>×</button>
          <style jsx>{`
            @keyframes slideIn {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </div>
      )}

      <WebSocketStatus />
    </div>
  );
}
