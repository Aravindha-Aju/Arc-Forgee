'use client';
import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const fetchData = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/dashboard/summary');
      const jsonData = await res.json();
      setData(jsonData);
      setLastUpdated(jsonData.last_updated);
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh every 10 seconds to simulate real-time flight deck
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (!data) return <div style={{padding: '4rem', textAlign: 'center', fontFamily: 'var(--font-heading)', fontSize: '2rem'}}>INITIALIZING_SYSTEM...</div>;

  const chartData = [
    { name: 'CRITICAL', value: data.severity_breakdown.Critical, fill: 'var(--accent-red)' },
    { name: 'HIGH', value: data.severity_breakdown.High, fill: '#FF8800' },
    { name: 'MEDIUM', value: data.severity_breakdown.Medium, fill: 'var(--accent-yellow)' },
    { name: 'LOW', value: data.severity_breakdown.Low, fill: 'var(--accent-blue)' },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: 'var(--border-thick)', paddingBottom: '1rem', marginBottom: '2rem'}}>
        <h1 style={{margin: 0, border: 'none', padding: 0}}>SOC_FLIGHT_DECK<br/><span style={{color: 'var(--accent-yellow)', fontSize: '1.5rem'}}>// REAL_TIME_TELEMETRY</span></h1>
        <div style={{textAlign: 'right', fontFamily: 'var(--font-body)'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end', marginBottom: '0.5rem'}}>
            <span style={{width: '10px', height: '10px', background: '#00ff41', borderRadius: '50%', display: 'inline-block', animation: 'pulse 1.5s infinite'}}></span>
            <span style={{color: '#00ff41', fontWeight: 'bold', letterSpacing: '2px'}}>LIVE FEED</span>
          </div>
          <div style={{fontSize: '0.8rem', color: '#666'}}>LAST_SYNC: {lastUpdated}</div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid-4" style={{marginBottom: '2rem'}}>
        <KpiCard label="TOTAL_ASSETS" value={data.kpi.total_assets} color="var(--fg)" />
        <KpiCard label="EXPOSED_NODES" value={data.kpi.exposed_assets} color="var(--accent-yellow)" />
        <KpiCard label="CRITICAL_VULNS" value={data.kpi.critical_vulns} color="var(--accent-red)" />
        <KpiCard label="ACTIVE_THREATS" value={data.kpi.active_threats} color="var(--accent-blue)" />
      </div>

      {/* Main Grid: Chart + Live Feed */}
      <div className="grid-2" style={{gridTemplateColumns: '1fr 1.5fr'}}>
        
        {/* Severity Chart */}
        <div className="card">
          <h2 style={{fontSize: '1.2rem', marginBottom: '1rem'}}>EVENT_SEVERITY_DISTRIBUTION</h2>
          <div style={{height: '250px'}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{top: 10, right: 10, left: -20, bottom: 0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="name" stroke="#888" tick={{fontSize: 10, fontFamily: 'var(--font-heading)'}} />
                <YAxis stroke="#888" tick={{fontSize: 10}} />
                <Tooltip contentStyle={{background: '#111', color: '#fff', border: '2px solid #fff', fontFamily: 'var(--font-body)'}} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Event Feed */}
        <div className="card" style={{background: '#0a0a0a', borderColor: '#333'}}>
          <h2 style={{fontSize: '1.2rem', marginBottom: '1rem', color: '#00ff41'}}>LIVE_EVENT_STREAM</h2>
          <div style={{maxHeight: '250px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.85rem'}}>
            {data.recent_events.map((ev: any, i: number) => (
              <div key={i} style={{display: 'flex', gap: '1rem', padding: '0.5rem 0', borderBottom: '1px solid #222', color: '#ccc'}}>
                <span style={{color: '#666', minWidth: '60px'}}>{ev.timestamp}</span>
                <span style={{
                  color: ev.severity === 'Critical' ? 'var(--accent-red)' : ev.severity === 'High' ? '#FF8800' : 'var(--accent-yellow)',
                  minWidth: '70px', fontWeight: 'bold'
                }}>
                  [{ev.severity.toUpperCase()}]
                </span>
                <span style={{color: '#fff', flex: 1}}>{ev.type}</span>
                <span style={{color: '#666'}}>{ev.asset}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes pulse {
          0% { opacity: 1; box-shadow: 0 0 0 0 rgba(0, 255, 65, 0.7); }
          70% { opacity: 0.7; box-shadow: 0 0 0 6px rgba(0, 255, 65, 0); }
          100% { opacity: 1; box-shadow: 0 0 0 0 rgba(0, 255, 65, 0); }
        }
      `}</style>
    </div>
  );
}

function KpiCard({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div className="card" style={{borderColor: color, boxShadow: `6px 6px 0 ${color}`, textAlign: 'center', padding: '1.5rem'}}>
      <div style={{fontSize: '0.8rem', color: '#666', letterSpacing: '2px', marginBottom: '0.5rem'}}>{label}</div>
      <div style={{fontSize: '3.5rem', fontFamily: 'var(--font-heading)', color: color, lineHeight: 1}}>{value.toString().padStart(2, '0')}</div>
    </div>
  );
}
