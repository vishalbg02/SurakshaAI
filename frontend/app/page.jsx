"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="relative">
      {/* HERO */}
      <section className="hero-gradient relative overflow-hidden min-h-[90vh] flex items-center">
        {/* Floating shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-[10%] w-72 h-72 bg-sb-accent/5 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-[15%] w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-float-delayed" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/3 rounded-full blur-3xl" />
          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }} />
        </div>

        <div className={`relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center transition-all duration-1000 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-sb-card/60 border border-sb-border/50 rounded-full text-xs text-sb-textSecondary mb-8 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 bg-risk-low rounded-full animate-pulse" />
            100% Free &middot; No Signup &middot; No Tracking
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-sb-text leading-[1.05] tracking-tight mb-6">
            Stop Digital Fraud<br />
            <span className="bg-gradient-to-r from-sb-accent via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Before It Stops You
            </span>
          </h1>

          <p className="text-base sm:text-lg text-sb-textSecondary max-w-2xl mx-auto mb-10 leading-relaxed">
            Explainable AI + Rule-Based Detection for SMS, WhatsApp &amp; Call Scams.
            Understand exactly why a message is dangerous.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/analyzer"
              className="px-8 py-3.5 bg-sb-accent hover:bg-sb-accentHover text-white font-semibold rounded-xl text-sm transition-all btn-press shadow-lg shadow-sb-accent/25 hover:shadow-sb-accent/40"
            >
              Analyze a Message
            </Link>
            <Link
              href="/dashboard"
              className="px-8 py-3.5 bg-sb-card hover:bg-sb-hover border border-sb-border text-sb-text font-semibold rounded-xl text-sm transition-all btn-press"
            >
              View Live Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-sb-textSecondary text-sm uppercase tracking-[0.2em] mb-4 font-medium">The Problem</p>
          <h2 className="text-center text-2xl sm:text-3xl font-bold text-sb-text mb-4 tracking-tight">
            Scams exploit urgency, authority, and trust
          </h2>
          <p className="text-center text-sb-textSecondary max-w-xl mx-auto mb-16 text-sm leading-relaxed">
            Most people react emotionally. SurakshaAI exposes the manipulation before you do.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ThreatCard
              icon={<ClockIcon />}
              title="Urgency"
              desc="Time pressure forces impulsive action. &quot;Act within 24 hours or lose access.&quot;"
            />
            <ThreatCard
              icon={<ShieldIcon />}
              title="Authority"
              desc="Impersonating banks, police, or government agencies to bypass skepticism."
            />
            <ThreatCard
              icon={<HeartIcon />}
              title="Emotional Exploitation"
              desc="Family impersonation, fear tactics, and financial pressure to override logic."
            />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-sb-surface">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-sb-textSecondary text-sm uppercase tracking-[0.2em] mb-4 font-medium">How It Works</p>
          <h2 className="text-center text-2xl sm:text-3xl font-bold text-sb-text mb-16 tracking-tight">
            Three steps to clarity
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 relative">
            {/* Connector lines */}
            <div className="hidden sm:block absolute top-12 left-[calc(33.33%+0.5rem)] right-[calc(33.33%+0.5rem)] h-px bg-gradient-to-r from-sb-border via-sb-accent/30 to-sb-border" />

            <StepCard num="01" title="Paste Message" desc="SMS, WhatsApp, email, or call transcript. Supports English, Hindi, and Hinglish." />
            <StepCard num="02" title="Dual-Engine Analysis" desc="Rule-based keyword detection + BART AI model analyze simultaneously." />
            <StepCard num="03" title="Explainable Assessment" desc="See exactly which phrases triggered, what tactics were used, and how to stay safe." />
          </div>
        </div>
      </section>

      {/* DIFFERENTIATORS */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-sb-textSecondary text-sm uppercase tracking-[0.2em] mb-4 font-medium">Why SurakshaAI</p>
          <h2 className="text-center text-2xl sm:text-3xl font-bold text-sb-text mb-16 tracking-tight">
            Built different
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FeatureCard title="Works Without AI" desc="Rule engine operates independently. AI enhances, never gates." />
            <FeatureCard title="Phrase-Level Explainability" desc="Every flagged word is highlighted with its exact category." />
            <FeatureCard title="Social Impersonation Detection" desc="Catches &quot;Hi Dad, lost my phone&quot; family impersonation scams." />
            <FeatureCard title="Psychological Profiling" desc="Detects fear, urgency, authority, and emotional manipulation tactics." />
            <FeatureCard title="Offline-Capable Architecture" desc="Rule engine and database work without internet. AI is optional." />
            <FeatureCard title="Completely Free" desc="No signup, no tracking, no external API calls. Your data stays local." />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-sb-surface">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-sb-text mb-4 tracking-tight">
            Ready to analyze?
          </h2>
          <p className="text-sb-textSecondary mb-8 text-sm">
            Paste any suspicious message and get an instant, explainable risk assessment.
          </p>
          <Link
            href="/analyzer"
            className="inline-flex px-8 py-3.5 bg-sb-accent hover:bg-sb-accentHover text-white font-semibold rounded-xl text-sm transition-all btn-press shadow-lg shadow-sb-accent/25"
          >
            Open Analyzer
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-sb-border py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-sb-accent rounded flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <span className="text-xs text-sb-textMuted">SurakshaAI &copy; {new Date().getFullYear()}</span>
          </div>
          <p className="text-xs text-sb-textMuted">
            Explainable Multilingual Fraud Intelligence Engine
          </p>
        </div>
      </footer>
    </div>
  );
}

function ThreatCard({ icon, title, desc }) {
  return (
    <div className="bg-sb-card border border-sb-border rounded-2xl p-6 card-hover">
      <div className="w-10 h-10 bg-sb-accent/10 rounded-xl flex items-center justify-center mb-4 text-sb-accent">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-sb-text mb-2">{title}</h3>
      <p className="text-xs text-sb-textSecondary leading-relaxed">{desc}</p>
    </div>
  );
}

function StepCard({ num, title, desc }) {
  return (
    <div className="text-center px-6 py-4">
      <div className="w-10 h-10 bg-sb-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-xs font-bold text-sb-accent font-mono">{num}</span>
      </div>
      <h3 className="text-sm font-semibold text-sb-text mb-2">{title}</h3>
      <p className="text-xs text-sb-textSecondary leading-relaxed">{desc}</p>
    </div>
  );
}

function FeatureCard({ title, desc }) {
  return (
    <div className="bg-sb-card border border-sb-border rounded-2xl p-5 card-hover group cursor-default">
      <h3 className="text-sm font-semibold text-sb-text mb-1.5 group-hover:text-sb-accent transition-colors">{title}</h3>
      <p className="text-xs text-sb-textSecondary leading-relaxed">{desc}</p>
    </div>
  );
}

function ClockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  );
}