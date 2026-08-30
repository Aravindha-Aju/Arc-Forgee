'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function PortfolioPage() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetch('http://localhost:8001/api/portfolio')
      .then(r => r.json())
      .then(setData)
      .catch(console.error);
  }, []);

  // Live updates via WebSocket from Block 1 integration
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: any;
    
    const connect = () => {
      try {
        ws = new WebSocket('ws://localhost:8001/ws/risk');
        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'risk_update') {
              // Update the specific asset in the list
              setData(prev => prev.map(item => 
                item.asset_id === msg.asset_id 
                  ? { ...item, risk_score: msg.new_score, ale: msg.ale }
                  : item
              ));
              
              // Show brief flash notification
              const flash = document.createElement('div');
              flash.style.cssText = 'position:fixed;top:1rem;right:1rem;background:#000;color:#05ffa1;padding:1rem 1.5rem;border:3px solid #05ffa1;box-shadow:6px 6px 0 #05ffa1;font-family:Arial Black;z-index:9999;animation:slideIn 0.3s';
              flash.innerHTML = '⚡ RISK UPDATED: ' + msg.asset_name + '<br/>' + (msg.old_score || '?') + ' → ' + msg.new_score;
              document.body.appendChild(flash);
              setTimeout(() => flash.remove(), 3000);
            }
          } catch (e) {}
        };
        ws.onclose = () => { reconnectTimer = setTimeout(connect, 3000); };
        ws.onerror = () => { if (ws) ws.close(); };
      } catch (e) {}
    };
    
    connect();
    return () => { if (ws) ws.close(); clearTimeout(reconnectTimer); };
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'var(--accent-red)';
    if (score >= 40) return 'var(--accent-yellow)';
    return 'var(--accent-green)';
  };

  return (
    <div>
      <h1>RISK_PORTFOLIO<br/><span style={{color: 'var(--accent-blue)'}}>// FINANCIAL_EXPOSURE</span></h1>
      
      <div className="grid-3" style={{marginBottom: '3rem'}}>
        <div className="card card-red">
          <span className="label">TOTAL_AT_RISK_ALE</span>
          <div style={{fontSize: '2.5rem', fontFamily: 'var(--font-heading)'}}>
            ${data.reduce((sum, item) => sum + item.ale, 0).toLocaleString()}
          </div>
        </div>
        <div className="card card-yellow">
          <span className="label">HIGH_RISK_ASSETS</span>
          <div style={{fontSize: '2.5rem', fontFamily: 'var(--font-heading)'}}>
            {data.filter(d => d.risk_score >= 70).length}
          </div>
        </div>
        <div className="card card-blue">
          <span className="label">TOTAL_BLAST_RADIUS</span>
          <div style={{fontSize: '2.5rem', fontFamily: 'var(--font-heading)'}}>
            {data.reduce((sum, item) => sum + item.blast_radius, 0)}
          </div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>ASSET_NAME</th>
            <th>CRITICALITY</th>
            <th>RISK_SCORE</th>
            <th>ANNUALIZED_LOSS (ALE)</th>
            <th>BLAST_RADIUS</th>
            <th>ACTION</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.asset_id}>
              <td style={{fontWeight: 'bold', fontFamily: 'var(--font-heading)'}}>{item.asset_name}</td>
              <td><span className="badge">{item.criticality}</span></td>
              <td>
                <span style={{color: getScoreColor(item.risk_score), fontFamily: 'var(--font-heading)', fontSize: '1.2rem'}}>
                  {item.risk_score}/100
                </span>
              </td>
              <td>${item.ale.toLocaleString()}</td>
              <td>{item.blast_radius} dependent assets</td>
              <td>
                <Link href={`/asset/${item.asset_id}`} className="btn" style={{padding: '0.5rem 1rem', fontSize: '0.8rem'}}>
                  INSPECT ->
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
