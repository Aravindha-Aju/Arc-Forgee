'use client';
import { useState } from 'react';

export default function ExportPanel({ assetId, assetName }: { assetId: string, assetName: string }) {
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = async (format: 'csv' | 'json' | 'pdf') => {
    setExporting(format);
    if (format === 'pdf') { 
      window.print(); 
      setExporting(null); 
      return; 
    }
    
    try {
      const response = await fetch(`http://localhost:8001/api/asset/${assetId}/export/${format}`);
      
      if (format === 'csv') {
        const text = await response.text();
        const blob = new Blob([text], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${assetName}_risk_report.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${assetName}_risk_report.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (error) { 
      console.error('Export failed:', error); 
      alert('Export failed. Check console for details.');
    }
    setExporting(null);
  };

  return (
    <div className="card" style={{marginTop: '2rem'}}>
      <h2>// EXPORT_REPORT</h2>
      <p className="label" style={{marginBottom: '1.5rem'}}>Generate comprehensive risk report for {assetName}</p>
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem'}}>
        <button className="btn" onClick={() => handleExport('csv')} disabled={exporting === 'csv'} style={{background: exporting === 'csv' ? '#ccc' : 'var(--accent-yellow)', cursor: exporting === 'csv' ? 'not-allowed' : 'pointer'}}>
          {exporting === 'csv' ? 'EXPORTING...' : 'EXPORT CSV'}
        </button>
        <button className="btn" onClick={() => handleExport('json')} disabled={exporting === 'json'} style={{background: exporting === 'json' ? '#ccc' : 'var(--accent-blue)', color: '#fff', border: '2px solid var(--accent-blue)', cursor: exporting === 'json' ? 'not-allowed' : 'pointer'}}>
          {exporting === 'json' ? 'EXPORTING...' : 'EXPORT JSON'}
        </button>
        <button className="btn" onClick={() => handleExport('pdf')} style={{background: 'var(--accent-red)', color: '#fff', border: '2px solid var(--accent-red)'}}>
          EXPORT PDF (Print)
        </button>
      </div>
    </div>
  );
}
