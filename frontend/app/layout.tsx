import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "MarkX // CYBER-INTEL", description: "Neo-Brutalist Security Platform" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="nav-brutal">
          <div className="nav-logo">[ MarkX ]</div>
          <div className="nav-links">
            <a href="/">Overview</a>
            <a href="/assets">Assets</a>
            <a href="/risk">Risk_Eng</a>
            <a href="/dashboard">Dashboard</a>
            <a href="/upload">Upload_CSV</a>
            <a href="/engine" style={{background: 'var(--accent-yellow)', color: '#000'}}>AI_Engine</a>
          </div>
        </nav>
        <div className="container">{children}</div>
      </body>
    </html>
  );
}
