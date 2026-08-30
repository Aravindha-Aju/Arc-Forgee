'use client';
import { useEffect, useState } from 'react';

export default function AssetDetailPage({ params }: { params: { id: string } }) {
  const [ctx, setCtx] = useState<any>(null);

  useEffect(() => {
    fetch(`http://localhost:8000/api/security-context/${params.id}`)
      .then(r => r.json())
      .then(d => setCtx(d))
      .catch(e => console.error(e));
  }, [params.id]);

  if (!ctx) return <div style={{padding: '4rem', textAlign: 'center', fontFamily: 'var(--font-heading)', fontSize: '2rem'}}>LOADING_DATA_STREAM...</div>;

  return (
    <div>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem'}}>
        <h1 style={{margin: 0, border: 'none', padding: 0, fontSize: 'clamp(2.5rem, 5vw, 4rem)'}}>{ctx.asset.name}</h1>
        <div>
          {ctx.asset.internet_exposed && <span className="badge badge-red">INTERNET_EXPOSED</span>}
          <span className="badge badge-black">{ctx.asset.type}</span>
        </div>
      </div>

      <div className="grid-2">
        <div>
          {ctx.business_context && (
            <div className="card card-accent-yellow" style={{marginBottom: '2rem'}}>
              <h2>// BUSINESS_CONTEXT</h2>
              <div className="grid-2" style={{gap: '1.5rem'}}>
                <div>
                  <span className="label">Criticality</span>
                  <div style={{fontSize: '1.5rem', fontFamily: 'var(--font-heading)'}}>{ctx.business_context.criticality}</div>
                </div>
                <div>
                  <span className="label">Function</span>
                  <div style={{fontSize: '1.2rem'}}>{ctx.business_context.business_function}</div>
                </div>
                <div>
                  <span className="label">Data_Sensitivity</span>
                  <div style={{fontSize: '1.2rem'}}>{ctx.business_context.data_sensitivity}</div>
                </div>
                <div>
                  <span className="label">Revenue_Dependency</span>
                  <div style={{fontSize: '1.2rem'}}>{ctx.business_context.revenue_dependency}</div>
                </div>
              </div>
            </div>
          )}

          {ctx.intelligence.length > 0 && (
            <div className="card card-accent-red" style={{marginBottom: '2rem'}}>
              <h2 style={{color: 'var(--accent-red)'}}>⚠ SECURITY_INTELLIGENCE</h2>
              {ctx.intelligence.map((intel: any, i: number) => (
                <div key={i} style={{borderLeft: '4px solid var(--accent-red)', paddingLeft: '1.5rem', marginBottom: '1.5rem'}}>
                  <h3 style={{color: 'var(--fg)', marginBottom: '0.5rem'}}>{intel.classification.replace(/_/g, ' ')}</h3>
                  <p style={{marginBottom: '1rem', fontSize: '1.05rem'}}>{intel.explanation}</p>
                  <div style={{fontSize: '0.9rem', fontFamily: 'var(--font-body)'}}>
                    <span style={{marginRight: '2rem'}}>MITRE: <strong>{intel.mitre_technique}</strong></span>
                    <span>CONFIDENCE: <strong>{(intel.confidence * 100).toFixed(0)}%</strong></span>
                  </div>
                  <div style={{marginTop: '1rem'}}>
                    {intel.evidence.map((ev: string) => (
                      <span key={ev} className="badge" style={{background: '#fff'}}>{ev}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="grid-2" style={{gap: '1.5rem'}}>
            <div className="card">
              <h2 style={{color: 'var(--accent-red)'}}>VULNERABILITIES</h2>
              {ctx.vulnerabilities.map((v: any) => (
                <div key={v.id} style={{border: '2px solid var(--accent-red)', padding: '1rem', marginBottom: '1rem', background: '#fff'}}>
                  <strong style={{fontFamily: 'var(--font-heading)', fontSize: '1.1rem'}}>{v.cve}</strong>
                  <span style={{marginLeft: '1rem'}}>({v.severity}) - {v.patch_status}</span>
                </div>
              ))}
            </div>
            <div className="card">
              <h2>CONTROLS</h2>
              {ctx.controls.map((c: any) => (
                <div key={c.name} style={{display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #111', padding: '1rem 0'}}>
                  <span style={{fontFamily: 'var(--font-heading)', fontSize: '1.1rem'}}>{c.name}</span>
                  <span className={c.status === 'enabled' ? 'badge badge-black' : 'badge badge-red'}>
                    {c.status === 'enabled' ? 'ACTIVE' : 'DISABLED'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="card" style={{background: '#fff'}}>
            <h2>// RAW_EVIDENCE_FEED</h2>
            <p className="meta" style={{marginBottom: '1.5rem'}}>IMMUTABLE_SOURCE_DATA</p>
            <div style={{maxHeight: '800px', overflowY: 'auto'}}>
              {ctx.evidence.map((ev: any) => (
                <div key={ev.id} className="evidence-block" style={{marginBottom: '1.5rem'}}>
                  <div className="evidence-header">
                    <span style={{color: '#fff'}}>[{ev.id}]</span>
                    <span style={{marginLeft: '1rem'}}>:: {ev.source.toUpperCase()}</span>
                  </div>
                  {JSON.stringify(ev.raw_event, null, 2)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
