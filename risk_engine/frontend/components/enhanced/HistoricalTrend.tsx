'use client';
import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function HistoricalTrend({ assetId }: { assetId: string }) {
  const [data, setData] = useState<any[]>([]);
  useEffect(() => {
    fetch(`http://localhost:8001/api/asset/${assetId}/history`).then(r => r.json()).then(d => setData(d.history || [])).catch(console.error);
  }, [assetId]);
  if (data.length === 0) return null;
  return (
    <div className="card" style={{marginTop: '2rem'}}>
      <h2>// HISTORICAL_RISK_TREND — 30_DAYS</h2>
      <div style={{height: '300px', marginTop: '1rem'}}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{top: 10, right: 30, left: 0, bottom: 0}}>
            <defs><linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--accent-red)" stopOpacity={0.8}/><stop offset="95%" stopColor="var(--accent-red)" stopOpacity={0.1}/></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
            <XAxis dataKey="date" stroke="#111" fontSize={11} tickFormatter={(v: string) => new Date(v).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})} interval={4} />
            <YAxis stroke="#111" fontSize={11} domain={[0, 100]} />
            <Tooltip contentStyle={{background: '#fff', border: '3px solid #111', boxShadow: '4px 4px 0 #111', fontFamily: 'var(--font-body)'}} formatter={(value: any) => [`${value}/100`, 'Risk Score']} labelFormatter={(label: any) => `Date: ${new Date(label).toLocaleDateString()}`} />
            <ReferenceLine y={70} stroke="var(--accent-red)" strokeDasharray="3 3" label={{value: 'CRITICAL', fill: 'var(--accent-red)', fontSize: 10}} />
            <ReferenceLine y={40} stroke="var(--accent-yellow)" strokeDasharray="3 3" label={{value: 'MEDIUM', fill: 'var(--accent-yellow)', fontSize: 10}} />
            <Area type="monotone" dataKey="score" stroke="var(--accent-red)" strokeWidth={3} fill="url(#riskGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}