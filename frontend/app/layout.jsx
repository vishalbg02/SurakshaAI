import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "SurakshaAI — Fraud Intelligence Platform",
  description: "Real-time fraud intelligence for SMS, WhatsApp & call scams.",
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
        <nav className="sticky top-0 z-50 glass border-b border-cx-border/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-7 h-7 bg-gradient-to-br from-cx-accent to-cx-accentDim rounded-lg flex items-center justify-center shadow-lg shadow-cx-accent/20">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <span className="text-[15px] font-bold text-cx-text tracking-tight">
                Suraksha<span className="text-cx-accent">AI</span>
              </span>
            </Link>
            <div className="flex items-center gap-0.5">
              {[
                { href: "/", label: "Home" },
                { href: "/analyzer", label: "Analyzer" },
                { href: "/simulator", label: "Simulator" },
                { href: "/dashboard", label: "Dashboard" },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="px-3 py-1.5 text-[13px] text-cx-textSec hover:text-cx-text rounded-lg hover:bg-cx-card transition-all duration-200"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </nav>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}