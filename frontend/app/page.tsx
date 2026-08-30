import Link from 'next/link';

export default function Home() {
  return (
    <div>
      <h1>SYSTEM_OVERVIEW<br/><span style={{color: 'var(--accent-red)'}}>LIVE_FEED</span></h1>
      
      <div className="grid-4">
        <div className="card">
          <span className="label">Total_Assets</span>
          <div style={{fontSize: '4rem', fontFamily: 'var(--font-heading)', lineHeight: 1}}>54</div>
          <div className="meta" style={{marginTop: '1rem'}}>>> NETWORK_MAP</div>
        </div>
        <div className="card card-accent-yellow">
          <span className="label">Exposed_Nodes</span>
          <div style={{fontSize: '4rem', fontFamily: 'var(--font-heading)', lineHeight: 1}}>12</div>
          <div className="meta" style={{marginTop: '1rem'}}>>> ATTACK_SURFACE</div>
        </div>
        <div className="card card-accent-red">
          <span className="label">Critical_Vulns</span>
          <div style={{fontSize: '4rem', fontFamily: 'var(--font-heading)', lineHeight: 1}}>01</div>
          <div className="meta" style={{marginTop: '1rem'}}>>> IMMEDIATE_ACTION</div>
        </div>
        <div className="card">
          <span className="label">Active_Threats</span>
          <div style={{fontSize: '4rem', fontFamily: 'var(--font-heading)', lineHeight: 1}}>02</div>
          <div className="meta" style={{marginTop: '1rem'}}>>> THREAT_INTEL</div>
        </div>
      </div>

      <div className="divider"></div>

      <div className="card" style={{maxWidth: '800px'}}>
        <h2>// QUICK_ACCESS_TERMINAL</h2>
        <p style={{marginBottom: '2rem', fontSize: '1.1rem'}}>
          Inspect the primary payment infrastructure node currently under active brute-force analysis.
        </p>
        <Link href="/assets/ASSET-001" className="btn">
          INSPECT: PAYMENT-SERVER [ASSET-001] ->
        </Link>
      </div>
    </div>
  );
}
