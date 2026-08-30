'use client';
import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function ComparativeAnalysis({ assetId, riskScore, ale, blastRadius }: { assetId: string, riskScore: number, ale: number, blastRadius: number }) {
  const [benchmarks, setBenchmarks] = useState<any>(null);
  useEffect(() => { fetch('http://localhost:8001/api/portfolio/benchmarks').then(r => r.json()).then(setBenchmarks).catch(console.error); }, []);
  if (!benchmarks) return null;
  const comparisonData = [
    { metric: 'Risk Score', thisAsset: riskScore, portfolioAvg: benchmarks.averages.risk_score },
    { metric: 'ALE ($K)', thisAsset: Math.round(ale / 1000), portfolioAvg: Math.round(benchmarks.averages.ale / 1000) },
    { metric: 'Blast Radius', thisAsset: blastRadius, portfolioAvg: benchmarks.averages.blast_radius }
  ];
  return (
    <div className="card card-blue" style={{marginTop: '2rem'}}>
      <h2 style={{color: 'var(--accent-blue)'}}>// COMPARATIVE_ANALYSIS — VS_PORTFOLIO</h2>
      <p className="label" style={{marginBottom: '1rem'}}>This asset compared to portfolio average ({benchmarks.count} assets)</p>
      <div style={{height: '300px', marginBottom: '1.5rem'}}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={comparisonData} margin={{top: 20, right: 30, left: 20, bottom: 5}}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
            <XAxis dataKey="metric" stroke="#111" fontSize={12} fontFamily="var(--font-heading)" />
            <YAxis stroke="#111" fontSize={11} />
            <Tooltip contentStyle={{background: '#fff', border: '3px solid #111', boxShadow: '4px 4px 0 #111', fontFamily: 'var(--font-body)'}} />
            <Legend wrapperStyle={{fontFamily: 'var(--font-heading)', fontSize: '0.85rem'}} />
            <Bar dataKey="thisAsset" name="This Asset" fill="var(--accent-blue)" stroke="#111" strokeWidth={2} />
            <Bar dataKey="portfolioAvg" name="Portfolio Avg" fill="#ccc" stroke="#111" strokeWidth={2} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}