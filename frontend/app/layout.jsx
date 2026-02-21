import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "SurakshaAI – Fraud Intelligence Engine",
  description:
    "Explainable multilingual fraud detection for SMS, WhatsApp, and call transcripts.",
};

/**
 * Root layout – persistent nav bar + page slot.
 * This is a SERVER component (no "use client" needed).
 * globals.css is imported here so Tailwind styles apply globally.
 */
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col">
        {/* ---- Navigation ---- */}
        <nav className="sticky top-0 z-50 bg-suraksha-card/80 backdrop-blur-md border-b border-suraksha-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-2xl">🛡️</span>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent group-hover:from-blue-300 group-hover:to-purple-300 transition-all">
                SurakshaAI
              </span>
            </Link>
            <div className="flex items-center gap-6">
              <Link
                href="/"
                className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                Analyzer
              </Link>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </nav>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-suraksha-border py-6 text-center text-xs text-gray-500">
          SurakshaAI &copy; {new Date().getFullYear()} &mdash; Explainable
          Multilingual Fraud Intelligence Engine
        </footer>
      </body>
    </html>
  );
}