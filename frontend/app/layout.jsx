import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "SurakshaAI — Digital Fraud Intelligence",
  description: "Explainable AI + Rule-Based Detection for SMS, WhatsApp & Call Scams.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <nav className="sticky top-0 z-50 bg-sb-bg/80 backdrop-blur-xl border-b border-sb-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-7 h-7 bg-sb-accent rounded-lg flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <span className="text-base font-bold text-sb-text tracking-tight">SurakshaAI</span>
            </Link>
            <div className="flex items-center gap-1">
              <Link href="/" className="px-3 py-1.5 text-sm text-sb-textSecondary hover:text-sb-text rounded-lg hover:bg-sb-card transition-all">
                Home
              </Link>
              <Link href="/analyzer" className="px-3 py-1.5 text-sm text-sb-textSecondary hover:text-sb-text rounded-lg hover:bg-sb-card transition-all">
                Analyzer
              </Link>
              <Link href="/dashboard" className="px-3 py-1.5 text-sm text-sb-textSecondary hover:text-sb-text rounded-lg hover:bg-sb-card transition-all">
                Dashboard
              </Link>
            </div>
          </div>
        </nav>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}