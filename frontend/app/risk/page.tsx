'use client';

export default function RiskEnginePage() {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh', 
      background: 'var(--bg)',
      overflow: 'hidden'
    }}>
      {/* Header Bar */}
      <div style={{ 
        padding: '1rem 2rem', 
        borderBottom: '4px solid #111', 
        background: '#fff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ 
            background: '#111', 
            color: '#fff', 
            padding: '0.5rem 1rem', 
            fontFamily: 'var(--font-heading)', 
            fontSize: '1.2rem', 
            border: '3px solid #111', 
            boxShadow: '4px 4px 0 var(--accent-blue)' 
          }}>
            MARKX :: RISK_ENGINE
          </div>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: '#666' }}>
            Live Connection: <span style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>ACTIVE (Port 3001)</span>
          </span>
        </div>
        <a 
          href="http://localhost:3001" 
          target="_blank" 
          className="btn" 
          style={{ fontSize: '0.8rem', padding: '0.5rem 1rem', background: 'var(--accent-blue)', color: '#fff', border: '2px solid #111', textDecoration: 'none' }}
        >
          OPEN IN NEW TAB ↗
        </a>
      </div>

      {/* Embedded Block 2 Frontend */}
      <iframe 
        src="http://localhost:3001" 
        style={{ 
          flex: 1, 
          width: '100%', 
          border: 'none', 
          background: '#FDFBF7' 
        }}
        title="MarkX Risk Engine"
      />
    </div>
  );
}
