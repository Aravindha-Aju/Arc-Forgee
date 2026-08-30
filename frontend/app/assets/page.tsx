import Link from 'next/link';

export default function AssetsPage() {
  return (
    <div>
      <h1>ASSET_INVENTORY<br/><span style={{color: 'var(--accent-yellow)'}}>// 54_RECORDS</span></h1>
      <table>
        <thead>
          <tr>
            <th>ID_TAG</th>
            <th>NODE_NAME</th>
            <th>TYPE</th>
            <th>ENV</th>
            <th>STATUS</th>
            <th>ACTION</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{fontFamily: 'var(--font-heading)'}}>ASSET-001</td>
            <td style={{fontWeight: 'bold'}}>payment-prod-01</td>
            <td>SERVER</td>
            <td>PROD</td>
            <td><span className="badge badge-red">CRITICAL</span></td>
            <td><Link href="/assets/ASSET-001" style={{fontWeight: 'bold', textDecoration: 'underline'}}>>> INSPECT</Link></td>
          </tr>
          <tr>
            <td style={{fontFamily: 'var(--font-heading)'}}>ASSET-002</td>
            <td style={{fontWeight: 'bold'}}>dev-api.example.com</td>
            <td>SUBDOMAIN</td>
            <td>DEV</td>
            <td><span className="badge badge-yellow">UNASSIGNED</span></td>
            <td><Link href="/assets/ASSET-002" style={{fontWeight: 'bold', textDecoration: 'underline'}}>>> INSPECT</Link></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
