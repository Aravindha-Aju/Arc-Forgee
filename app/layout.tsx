import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MarkX | Cyber Risk Platform",
  description: "AI-Powered Continuous Cyber Risk Quantification",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-gray-200 font-sans antialiased">
        <nav className="border-b border-gray-800 bg-surface/50 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white">M</div>
              <span className="text-xl font-bold text-white tracking-tight">MarkX</span>
            </div>
            <div className="flex gap-6 text-sm font-medium text-gray-400">
              <a href="/" className="hover:text-white transition">Overview</a>
              <a href="/assets" className="text-white">Assets</a>
              <a href="/risk" className="hover:text-white transition">Risk (Block 2)</a>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
