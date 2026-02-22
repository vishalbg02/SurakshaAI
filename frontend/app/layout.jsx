import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "SurakshaAI – Digital Fraud Intelligence Platform",
  description:
    "Analyze suspicious digital communications using explainable AI and rule-based detection.",
};

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
        {/* Header */}
        <header className="sticky top-0 z-50 bg-gov-navy">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Left: Title */}
              <Link href="/" className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                  <span className="text-gov-navy font-bold text-sm">S</span>
                </div>
                <div>
                  <span className="text-white font-bold text-lg leading-none block">
                    SurakshaAI
                  </span>
                  <span className="text-blue-200 text-[10px] leading-none hidden sm:block">
                    Digital Fraud Intelligence Platform
                  </span>
                </div>
              </Link>

              {/* Center: Nav */}
              <nav className="flex items-center gap-6">
                <Link
                  href="/"
                  className="text-sm font-medium text-blue-100 hover:text-white transition-colors"
                >
                  Analyzer
                </Link>
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-blue-100 hover:text-white transition-colors"
                >
                  Dashboard
                </Link>
              </nav>

              {/* Right: Badge */}
              <div className="hidden md:block">
                <span className="text-[10px] text-blue-200 border border-blue-300/30 rounded px-2 py-1">
                  Explainable AI + Rule-Based Detection
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1">{children}</main>

        {/* Footer */}
        <footer className="border-t border-gov-border py-6 text-center text-xs text-gov-muted bg-white">
          SurakshaAI &mdash; Digital Fraud Intelligence Platform &copy;{" "}
          {new Date().getFullYear()}
        </footer>
      </body>
    </html>
  );
}