import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "MarkX // RISK_ENGINE", description: "Quantified Cyber Risk Platform" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="nav-brutal">
          <div className="nav-logo">[ MarkX :: RISK ]</div>
          <div className="nav-links">
            <a href="/">Portfolio_View</a>
            <a href="http://localhost:3000" target="_blank">Block_1_Intel</a>
          </div>
        </nav>
        <div className="container">{children}</div>
      </body>
    </html>
  );
}
