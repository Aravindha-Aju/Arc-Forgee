'use client';
import { useState } from 'react';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState('events');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('file_type', fileType);

    try {
      const res = await fetch('http://localhost:8000/api/upload/csv', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ error: 'Upload failed' });
    }
    setLoading(false);
  };

  return (
    <div>
      <h1>DATA_INGESTION_ENGINE<br/><span style={{color: 'var(--accent-yellow)'}}>// CSV_UPLOAD_&_AI_ANALYSIS</span></h1>
      
      <div className="card" style={{maxWidth: '800px'}}>
        <h2>// SELECT_DATA_TYPE</h2>
        <div style={{display: 'flex', gap: '1rem', marginBottom: '2rem'}}>
          <button 
            className="btn" 
            style={{background: fileType === 'events' ? 'var(--fg)' : 'var(--bg)', color: fileType === 'events' ? '#fff' : 'var(--fg)'}}
            onClick={() => setFileType('events')}
          >SECURITY_EVENTS</button>
          <button 
            className="btn" 
            style={{background: fileType === 'assets' ? 'var(--fg)' : 'var(--bg)', color: fileType === 'assets' ? '#fff' : 'var(--fg)'}}
            onClick={() => setFileType('assets')}
          >ASSET_INVENTORY</button>
        </div>

        <div style={{border: '3px dashed var(--fg)', padding: '3rem', textAlign: 'center', marginBottom: '2rem', background: 'var(--bg)'}}>
          <input 
            type="file" 
            accept=".csv" 
            onChange={(e) => setFile(e.target.files?.[0] || null)} 
            style={{display: 'none'}} 
            id="csv-upload"
          />
          <label htmlFor="csv-upload" className="btn" style={{cursor: 'pointer'}}>
            {file ? file.name : 'CHOOSE_CSV_FILE'}
          </label>
          {file && <p style={{marginTop: '1rem', fontSize: '0.9rem'}}>{(file.size / 1024).toFixed(2)} KB</p>}
        </div>

        <button className="btn" style={{width: '100%', background: 'var(--accent-yellow)'}} onClick={handleUpload} disabled={loading || !file}>
          {loading ? 'PROCESSING & TRANSLATING...' : 'EXECUTE_INGESTION ->'}
        </button>

        {result && (
          <div style={{marginTop: '2rem'}}>
            {result.error ? (
              <div className="card card-accent-red">
                <h3 style={{color: 'var(--accent-red)'}}>ERROR:</h3>
                <pre style={{background: '#000', color: '#ff3b30', padding: '1rem', marginTop: '1rem'}}>{JSON.stringify(result, null, 2)}</pre>
              </div>
            ) : (
              <>
                <div className="card card-accent-yellow">
                  <h3>// INGESTION_RESULT</h3>
                  <pre style={{background: '#000', color: '#00ff41', padding: '1rem', marginTop: '1rem', overflow: 'auto'}}>
                    {JSON.stringify({ message: result.message, errors: result.errors }, null, 2)}
                  </pre>
                </div>

                {result.human_readable_translations && result.human_readable_translations.length > 0 && (
                  <div className="card" style={{borderColor: '#0055FF', boxShadow: '6px 6px 0 #0055FF', marginTop: '2rem'}}>
                    <h2 style={{color: '#0055FF'}}>📄 EXECUTIVE_BRIEFING (PLAIN_ENGLISH)</h2>
                    <p style={{marginBottom: '1.5rem', fontSize: '1rem', color: '#666'}}>
                      AI translation of the raw logs into non-technical language for business stakeholders.
                    </p>
                    <div style={{background: '#f4f4f4', padding: '1.5rem', border: '2px solid #111', fontFamily: 'Arial, sans-serif', lineHeight: 1.6}}>
                      {result.human_readable_translations.map((line: string, idx: number) => (
                        <p key={idx} style={{marginBottom: '0.5rem', fontSize: '1.05rem', color: '#111'}}>
                          {line.replace(/^[*-]\s*/, '• ')}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {result.ai_intelligence_generated && result.ai_intelligence_generated.length > 0 && (
                  <div className="card" style={{borderColor: 'var(--accent-blue)', boxShadow: '6px 6px 0 var(--accent-blue)', marginTop: '2rem'}}>
                    <h2 style={{color: 'var(--accent-blue)'}}>🧠 AI INTELLIGENCE GENERATED</h2>
                    {result.ai_intelligence_generated.map((intel: any, idx: number) => (
                      <div key={idx} style={{borderLeft: '4px solid var(--accent-blue)', paddingLeft: '1.5rem', marginBottom: '1.5rem', background: '#f4f4f4', padding: '1.5rem', border: '2px solid #111'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem'}}>
                          <h3 style={{margin: 0, fontSize: '1.2rem'}}>{intel.asset.toUpperCase()}</h3>
                          <span className="badge" style={{background: intel.validation_status === 'validated' ? '#000' : '#888', color: '#fff'}}>
                            {intel.validation_status.toUpperCase()}
                          </span>
                        </div>
                        <div className="badge badge-red" style={{marginBottom: '1rem'}}>{intel.classification.replace(/_/g, ' ').toUpperCase()}</div>
                        <p style={{fontSize: '1.1rem', marginBottom: '1rem', lineHeight: 1.5}}>{intel.explanation}</p>
                        <div style={{fontSize: '0.9rem', fontFamily: 'var(--font-body)', display: 'flex', gap: '2rem'}}>
                          <span>MITRE: <strong>{intel.mitre_technique}</strong></span>
                          <span>CONFIDENCE: <strong>{(intel.confidence * 100).toFixed(0)}%</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

                {/* BLOCK 2 INTEGRATION STATUS */}
                {result && result.block2_risk_updates && result.block2_risk_updates.length > 0 && (
                  <div className="card" style={{borderColor: 'var(--accent-blue)', boxShadow: '6px 6px 0 var(--accent-blue)', marginTop: '2rem'}}>
                    <h2 style={{color: 'var(--accent-blue)'}}>🔗 BLOCK_2_RISK_ENGINE_SYNC</h2>
                    <p style={{fontSize: '0.9rem', color: '#666', marginBottom: '1rem'}}>Real-time risk recalculation triggered in Block 2</p>
                    <table style={{width: '100%', fontSize: '0.85rem'}}>
                      <thead><tr>
                        <th style={{textAlign: 'left', padding: '0.5rem', background: '#f4f4f4'}}>ASSET</th>
                        <th style={{textAlign: 'left', padding: '0.5rem', background: '#f4f4f4'}}>STATUS</th>
                        <th style={{textAlign: 'left', padding: '0.5rem', background: '#f4f4f4'}}>RISK CHANGE</th>
                      </tr></thead>
                      <tbody>
                        {result.block2_risk_updates.map((update: any, idx: number) => (
                          <tr key={idx} style={{borderTop: '1px solid #ddd'}}>
                            <td style={{padding: '0.5rem', fontWeight: 'bold'}}>{update.asset_name}</td>
                            <td style={{padding: '0.5rem'}}>
                              <span className="badge" style={{background: update.status === 'updated' ? 'var(--accent-green)' : update.status === 'offline' ? 'var(--accent-yellow)' : 'var(--accent-red)', color: '#fff', border: 'none'}}>
                                {update.status === 'updated' ? '✓ UPDATED' : update.status === 'offline' ? '⚠ BLOCK 2 OFFLINE' : '✗ FAILED'}
                              </span>
                            </td>
                            <td style={{padding: '0.5rem', fontFamily: 'var(--font-body)'}}>
                              {update.old_score != null && update.new_score != null ? (
                                <span><span style={{color: '#888'}}>{update.old_score}</span> {' → '} <span style={{color: update.new_score > update.old_score ? 'var(--accent-red)' : 'var(--accent-green)', fontWeight: 'bold'}}>{update.new_score}</span></span>
                              ) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div style={{marginTop: '1rem'}}>
                      <a href="http://localhost:3001" target="_blank" className="btn" style={{fontSize: '0.8rem', padding: '0.5rem 1rem', background: 'var(--accent-blue)', color: '#fff', border: '2px solid var(--accent-blue)', textDecoration: 'none'}}>VIEW IN BLOCK 2 →</a>
                    </div>
                  </div>
                )}
      </div>
    </div>
  );
}
