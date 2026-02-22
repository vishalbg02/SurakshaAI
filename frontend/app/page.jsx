"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";

/* ═══════════════════════════════════════════════════════════
   HIGHLIGHT LOGIC
   ═══════════════════════════════════════════════════════════ */

const EXAMPLE_MSG = `Dear customer, your SBI account has been blocked due to KYC expiry. Click http://sbi-kyc-update.in to verify immediately or account will be permanently closed within 24 hours.`;

const HIGHLIGHTS = [
  { text: "SBI", color: "#F97316" },
  { text: "blocked", color: "#EF4444" },
  { text: "KYC expiry", color: "#EF4444" },
  { text: "http://sbi-kyc-update.in", color: "#EF4444" },
  { text: "immediately", color: "#F59E0B" },
  { text: "permanently closed", color: "#EF4444" },
  { text: "within 24 hours", color: "#F59E0B" },
];

function highlightText(msg, highlights) {
  const parts = [];
  let remaining = msg;
  highlights.forEach((h) => {
    const idx = remaining.indexOf(h.text);
    if (idx !== -1) {
      parts.push({ text: remaining.slice(0, idx), type: "plain" });
      parts.push({ text: h.text, type: "hl", color: h.color });
      remaining = remaining.slice(idx + h.text.length);
    }
  });
  if (remaining) parts.push({ text: remaining, type: "plain" });
  return parts;
}

/* ═══════════════════════════════════════════════════════════
   SCROLL REVEAL
   ═══════════════════════════════════════════════════════════ */

function useScrollReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

/* ═══════════════════════════════════════════════════════════
   SECTION DIVIDER
   ═══════════════════════════════════════════════════════════ */

function Divider() {
  return (
    <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
  );
}

/* ═══════════════════════════════════════════════════════════
   SECTION LABEL (consistent heading structure)
   ═══════════════════════════════════════════════════════════ */

function SectionLabel({ children }) {
  return (
    <p className="text-[11px] text-cx-accent font-semibold uppercase tracking-[0.2em] mb-3">
      {children}
    </p>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════ */

export default function LandingPage() {
  const [m, setM] = useState(false);
  const [showHL, setShowHL] = useState(false);

  useEffect(() => {
    setM(true);
    const t = setTimeout(() => setShowHL(true), 1200);
    return () => clearTimeout(t);
  }, []);

  const parts = highlightText(EXAMPLE_MSG, HIGHLIGHTS);

  return (
    <div className="relative">

      {/* ═══════════════════════════════════════════════════
          HERO — py-32 (largest spacing, anchor section)
          ═══════════════════════════════════════════════════ */}
      <section className="hero-bg relative overflow-hidden py-32 flex items-center min-h-[90vh]">
        {/* Background layers */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-16 left-[8%] w-80 h-80 bg-cx-accent/[0.04] rounded-full blur-3xl animate-float-a" />
          <div className="absolute bottom-24 right-[12%] w-96 h-96 bg-cx-violet/[0.04] rounded-full blur-3xl animate-float-b" />
          {/* Radial glow behind headline area */}
          <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-cx-accent/[0.03] rounded-full blur-[100px]" />
          <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "linear-gradient(rgba(148,163,184,0.15) 1px,transparent 1px),linear-gradient(90deg,rgba(148,163,184,0.15) 1px,transparent 1px)", backgroundSize: "48px 48px" }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left copy */}
            <div className={`transition-all duration-1000 ${m ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-cx-card/50 border border-cx-border/50 rounded-full text-[11px] text-cx-textSec mb-6 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 bg-risk-low rounded-full animate-pulse" />
                Fraud Intelligence Engine
              </div>

              <h1 className="text-[2.75rem] sm:text-5xl lg:text-[3.25rem] font-black text-cx-text leading-[1.08] tracking-tight mb-4">
                Real-Time Fraud<br />Intelligence for the<br />
                <span className="text-cx-accent">Modern Threat</span> Landscape
              </h1>

              {/* Subtle animated gradient line under headline */}
              <div className="h-[2px] w-24 bg-gradient-to-r from-cx-accent via-cx-violet to-transparent rounded-full mb-5 opacity-60" />

              <p className="text-base text-cx-textSec max-w-md leading-relaxed mb-8">
                Analyze suspicious SMS, WhatsApp, and call transcripts instantly.
                Understand exactly why a message is dangerous — before you act.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-12">
                <Link href="/analyzer" className="px-7 py-3.5 bg-cx-accent hover:bg-cx-accentHover text-white font-semibold rounded-xl text-sm transition-all btn-press shadow-lg shadow-cx-accent/20 hover:shadow-cx-accent/30 text-center">
                  Analyze a Message
                </Link>
                <a href="#demo" className="px-7 py-3.5 bg-cx-card hover:bg-cx-cardHover border border-cx-border text-cx-text font-semibold rounded-xl text-sm transition-all btn-press text-center">
                  See Detection in Action
                </a>
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                {["100% Free", "No Sign-up", "No Tracking", "Runs Locally", "AI Optional"].map((t) => (
                  <span key={t} className="flex items-center gap-1.5 text-[11px] text-cx-textDim">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Right preview */}
            <div className={`transition-all duration-1000 delay-300 ${m ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
              <div className="bg-cx-surface border border-cx-border rounded-2xl p-5 shadow-2xl shadow-black/30">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-cx-border">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-risk-crit/60" />
                    <span className="w-2.5 h-2.5 rounded-full bg-risk-med/60" />
                    <span className="w-2.5 h-2.5 rounded-full bg-risk-low/60" />
                  </div>
                  <span className="text-[10px] text-cx-textGhost font-mono ml-2">fraud-analysis.preview</span>
                </div>

                <div className="bg-cx-base/60 rounded-xl p-4 mb-4 border border-cx-border/50">
                  <p className="text-[12px] leading-relaxed font-mono">
                    {parts.map((p, i) =>
                      p.type === "plain" ? (
                        <span key={i} className="text-cx-textSec">{p.text}</span>
                      ) : (
                        <span key={i} className="font-semibold rounded-sm px-0.5 transition-all duration-700" style={{ color: showHL ? p.color : "#94A3B8", backgroundColor: showHL ? `${p.color}18` : "transparent", textShadow: showHL ? `0 0 12px ${p.color}30` : "none" }}>
                          {p.text}
                        </span>
                      )
                    )}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12">
                      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="#1E293B" strokeWidth="6" />
                        <circle cx="50" cy="50" r="42" fill="none" stroke="#EF4444" strokeWidth="6" strokeLinecap="round" strokeDasharray={264} strokeDashoffset={showHL ? 264 * (1 - 0.92) : 264} style={{ transition: "stroke-dashoffset 1.5s ease-out 0.5s" }} />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-cx-text" style={{ opacity: showHL ? 1 : 0, transition: "opacity 0.8s ease 1s" }}>92</span>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-risk-crit">Critical Risk</span>
                      <p className="text-[10px] text-cx-textDim">KYC phishing detected</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    {["Authority", "Fear", "Urgency"].map((t) => (
                      <span key={t} className="text-[9px] px-2 py-0.5 bg-cx-card border border-cx-border rounded text-cx-textDim" style={{ opacity: showHL ? 1 : 0, transition: `opacity 0.5s ease ${1.5 + Math.random()}s` }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Divider />

      {/* ═══════════════════════════════════════════════════
          THE VULNERABILITY — py-28 (major section)
          bg-white/[0.02] for depth alternation
          ═══════════════════════════════════════════════════ */}
      <section id="demo" className="relative py-28 px-4 sm:px-6 lg:px-8 bg-white/[0.015]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-16 items-center">
            <div className="lg:col-span-2">
              <SectionLabel>The Vulnerability</SectionLabel>
              <h2 className="text-3xl font-bold text-cx-text leading-tight tracking-tight mb-4">
                Why people fall<br />for digital scams
              </h2>
              <p className="text-sm text-cx-textSec leading-relaxed mb-4 max-w-sm">
                Scammers don't hack systems — they hack emotions. Urgency bypasses logic.
                Authority overrides skepticism. Fear prevents verification.
              </p>
              <p className="text-sm text-cx-textSec leading-relaxed max-w-sm">
                SurakshaAI deconstructs the manipulation layer by layer,
                showing you exactly which psychological tactics are being deployed.
              </p>
            </div>

            <div className="lg:col-span-3">
              <div className="bg-cx-surface border border-cx-border rounded-2xl p-6 space-y-2.5">
                <p className="text-[10px] text-cx-textGhost uppercase tracking-wider font-semibold mb-1">Anatomy of a Scam Message</p>
                {[
                  { phrase: "Your SBI account has been blocked", tactic: "Authority Impersonation", color: "#F97316" },
                  { phrase: "due to KYC expiry", tactic: "Fear Trigger", color: "#EF4444" },
                  { phrase: "Click http://sbi-kyc-update.in", tactic: "Malicious URL", color: "#EF4444" },
                  { phrase: "verify immediately", tactic: "Urgency Pressure", color: "#F59E0B" },
                  { phrase: "permanently closed within 24 hours", tactic: "Time Threat", color: "#F59E0B" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 bg-cx-base/50 rounded-xl px-4 py-2.5 border border-cx-border/40 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
                    <span className="text-[12px] font-mono font-medium flex-1" style={{ color: item.color }}>
                      &quot;{item.phrase}&quot;
                    </span>
                    <span className="text-[10px] text-cx-textDim whitespace-nowrap px-2 py-0.5 bg-cx-card rounded border border-cx-border">
                      {item.tactic}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Divider />

      {/* ═══════════════════════════════════════════════════
          HOW IT WORKS — py-28 (major section)
          bg-cx-deep for depth alternation
          ═══════════════════════════════��═══════════════════ */}
      <section className="relative py-28 px-4 sm:px-6 lg:px-8 bg-cx-deep">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <SectionLabel>Process</SectionLabel>
            <h2 className="text-3xl font-bold text-cx-text tracking-tight">How it works</h2>
          </div>

          <div className="relative">
            <div className="hidden md:block absolute top-8 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cx-border to-transparent" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
              {[
                { num: "01", title: "Input Message", desc: "Paste suspicious SMS, WhatsApp, email, or call transcript. Supports English, Hindi, and Hinglish. Voice input available.", icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" },
                { num: "02", title: "Dual-Engine Analysis", desc: "Rule-based keyword detection runs independently. BART AI model provides semantic classification. Both engines operate in parallel.", icon: "M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" },
                { num: "03", title: "Transparent Assessment", desc: "Every flagged phrase is explained. Psychological tactics are identified. Actionable safety recommendations are generated.", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
              ].map((step, i) => (
                <div key={i} className="text-center relative">
                  <div className="w-16 h-16 bg-cx-card border border-cx-border rounded-2xl flex items-center justify-center mx-auto mb-4 relative z-10 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.25)]">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={step.icon} /></svg>
                  </div>
                  <span className="text-[10px] text-cx-accent font-mono font-bold">{step.num}</span>
                  <h3 className="text-sm font-bold text-cx-text mt-1 mb-2">{step.title}</h3>
                  <p className="text-xs text-cx-textSec leading-relaxed max-w-[260px] mx-auto">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Divider />

      {/* ═══════════════════════════════════════════════════
          SIMULATOR PREVIEW — py-28 (major section)
          bg-white/[0.015] for depth alternation
          ═══════════════════════════════════════════════════ */}
      <SimulatorPreviewSection />

      <Divider />

      {/* ═══════════════════════════════════════════════════
          WHY SURAKSHA — py-28 (major section)
          bg-transparent (alternation)
          ═══════════════════════════════════════════════════ */}
      <section className="relative py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <SectionLabel>Capabilities</SectionLabel>
          <h2 className="text-3xl font-bold text-cx-text mb-3 tracking-tight">Built for real threats</h2>
          <p className="text-sm text-cx-textSec max-w-md mb-12">Not another checkbox AI tool. Purpose-built for the Indian digital fraud landscape.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {[
              { t: "Works Without AI", d: "Rule engine operates independently. AI enhances detection — it never gates it. Full analysis available offline." },
              { t: "Phrase-Level Explainability", d: "Every flagged word is highlighted with its exact category and risk contribution. No black boxes." },
              { t: "Social Impersonation Detection", d: "Catches \"Hi Dad, lost my phone\" family scams. Compound detection for new-number + money-request patterns." },
              { t: "Psychological Profiling", d: "Identifies fear, urgency, authority, emotional manipulation, financial coercion, and scarcity tactics." },
              { t: "Offline-Capable Architecture", d: "Rule engine and SQLite database work without internet. Zero cloud dependency for core functionality." },
              { t: "Completely Free", d: "No login. No tracking. No external API calls. No monetization. Your data never leaves your machine." },
            ].map((f, i) => (
              <div key={i} className="bg-cx-card border border-cx-border rounded-2xl p-5 group transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.25)] hover:border-cx-borderLight">
                <h3 className="text-sm font-bold text-cx-text mb-2 group-hover:text-cx-accent transition-colors duration-300">{f.t}</h3>
                <p className="text-xs text-cx-textSec leading-relaxed">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* ═══════════════════════════════════════════════════
          CTA — py-24 (supporting section, tighter)
          bg-cx-deep
          ═══════════════════════════════════════════════════ */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 bg-cx-deep">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-cx-text mb-3 tracking-tight">Ready to investigate?</h2>
          <p className="text-sm text-cx-textSec mb-8">Paste any suspicious message. Get instant, transparent risk intelligence.</p>
          <Link href="/analyzer" className="inline-flex px-8 py-3.5 bg-cx-accent hover:bg-cx-accentHover text-white font-semibold rounded-xl text-sm transition-all btn-press shadow-lg shadow-cx-accent/20">
            Open Analyzer
          </Link>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          FOOTER — tighter, grounded
          ═══════════════════════════════════════════════════ */}
      <footer className="border-t border-white/[0.06] py-6 px-4 bg-cx-base">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-[11px] text-cx-textGhost">SurakshaAI &copy; {new Date().getFullYear()}</span>
          <span className="text-[11px] text-cx-textGhost">Explainable Multilingual Fraud Intelligence Engine</span>
        </div>
      </footer>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SIMULATOR PREVIEW SECTION
   Consistent py-28, bg-white/[0.015] depth layer,
   scroll-reveal animations, same heading structure.
   ═══════════════════════════════════════════════════════════════ */

function SimulatorPreviewSection() {
  const [sectionRef, visible] = useScrollReveal();
  const [animStep, setAnimStep] = useState(0);

  useEffect(() => {
    if (!visible) return;
    const timers = [];
    timers.push(setTimeout(() => setAnimStep(1), 600));
    timers.push(setTimeout(() => setAnimStep(2), 1400));
    timers.push(setTimeout(() => setAnimStep(3), 2200));
    return () => timers.forEach(clearTimeout);
  }, [visible]);

  const CHAT_STEPS = [
    { msg: "Hi Dad, I lost my phone.", risk: 15, label: "Low" },
    { msg: "This is my new number.", risk: 35, label: "Low" },
    { msg: "I urgently need ₹10,000.", risk: 70, label: "High" },
    { msg: "Please send now, I'll explain later.", risk: 85, label: "Critical" },
  ];

  const currentRisk = animStep < CHAT_STEPS.length ? CHAT_STEPS[animStep].risk : 85;

  function riskColor(score) {
    if (score <= 30) return "#10B981";
    if (score <= 60) return "#F59E0B";
    if (score <= 80) return "#F97316";
    return "#EF4444";
  }

  const rc = riskColor(currentRisk);

  return (
    <section
      ref={sectionRef}
      className="relative py-28 px-4 sm:px-6 lg:px-8 bg-white/[0.015]"
    >
      <div className={`max-w-6xl mx-auto transition-all duration-1000 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left: text */}
          <div>
            <SectionLabel>Interactive Training</SectionLabel>
            <h2 className="text-3xl font-bold text-cx-text leading-tight tracking-tight mb-4">
              Experience the Scam<br />Simulation Lab
            </h2>
            <p className="text-sm text-cx-textSec leading-relaxed mb-8 max-w-sm">
              Step inside real-world fraud scenarios and see exactly how
              manipulation escalates — before it reaches you.
            </p>

            <ul className="space-y-2.5 mb-8">
              {[
                "Watch scams unfold step-by-step",
                "See risk score escalate in real time",
                "Understand emotional manipulation tactics",
                "Identify the exact breaking point",
                "Learn how to interrupt the fraud chain",
              ].map((item, i) => (
                <li
                  key={i}
                  className={`flex items-center gap-3 transition-all duration-500 ${visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}
                  style={{ transitionDelay: `${400 + i * 100}ms` }}
                >
                  <span className="flex-shrink-0 w-5 h-5 bg-cx-accentGlow rounded-md flex items-center justify-center">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                  </span>
                  <span className="text-[13px] text-cx-textSec">{item}</span>
                </li>
              ))}
            </ul>

            <Link href="/simulator" className="inline-flex px-7 py-3.5 bg-cx-accent hover:bg-cx-accentHover text-white font-semibold rounded-xl text-sm transition-all btn-press shadow-lg shadow-cx-accent/20 hover:shadow-cx-accent/30">
              Explore Simulator
            </Link>

            <p className="text-[10px] text-cx-textGhost mt-3">
              No signup required. 100% free. Educational use. Works offline.
            </p>
          </div>

          {/* Right: preview mock */}
          <div className={`transition-all duration-1000 delay-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <div className="bg-cx-surface border border-cx-border rounded-2xl shadow-2xl shadow-black/25 overflow-hidden">
              {/* Mock header */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-cx-border/60 bg-cx-card/30">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-cx-card border border-cx-border rounded-full flex items-center justify-center">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8z" /></svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-cx-text">Family Impersonation</p>
                    <p className="text-[8px] text-cx-textGhost">Simulation Preview</p>
                  </div>
                </div>
                <span className="text-[9px] font-mono text-cx-textGhost">{Math.min(animStep + 1, 4)}/4</span>
              </div>

              {/* Chat + Risk */}
              <div className="grid grid-cols-5">
                {/* Chat */}
                <div className="col-span-3 p-3.5 space-y-2 border-r border-cx-border/40 min-h-[220px]">
                  {CHAT_STEPS.map((step, i) => (
                    <div key={i} className={`transition-all duration-500 ${i <= animStep ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"}`} style={{ transitionDelay: `${i * 100}ms` }}>
                      <div className="bg-cx-card border border-cx-border rounded-xl rounded-bl-sm px-3 py-2 max-w-[90%]">
                        <p className="text-[8px] font-semibold text-risk-crit mb-0.5">Scammer</p>
                        <p className="text-[11px] text-cx-textSec leading-snug">{step.msg}</p>
                      </div>
                    </div>
                  ))}

                  {animStep < 3 && (
                    <div className="flex gap-1 px-3 py-2 animate-fade-in">
                      <span className="w-1 h-1 bg-cx-textGhost rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
                      <span className="w-1 h-1 bg-cx-textGhost rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
                      <span className="w-1 h-1 bg-cx-textGhost rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
                    </div>
                  )}
                </div>

                {/* Risk */}
                <div className="col-span-2 p-3.5 flex flex-col items-center justify-center gap-2.5">
                  <div className="relative w-14 h-14">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      <circle cx="50" cy="50" r="38" fill="none" stroke="#1E293B" strokeWidth="5" />
                      <circle cx="50" cy="50" r="38" fill="none" stroke={rc} strokeWidth="5" strokeLinecap="round" strokeDasharray={239} strokeDashoffset={239 * (1 - currentRisk / 100)} style={{ transition: "stroke-dashoffset 0.8s ease-out, stroke 0.5s ease", filter: `drop-shadow(0 0 4px ${rc}40)` }} />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-black tabular-nums transition-colors duration-500" style={{ color: rc }}>{currentRisk}</span>
                    </div>
                  </div>

                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full transition-all duration-500" style={{ backgroundColor: `${rc}12`, color: rc }}>
                    {CHAT_STEPS[Math.min(animStep, 3)].label}
                  </span>

                  <div className="space-y-1 w-full">
                    {["Emotional", "Urgency", "Financial"].map((tactic, i) => (
                      <div key={tactic} className={`text-center transition-all duration-500 ${animStep >= i + 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"}`} style={{ transitionDelay: `${i * 200}ms` }}>
                        <span className="text-[8px] px-1.5 py-0.5 bg-cx-violetGlow text-cx-violet border border-cx-violet/10 rounded">{tactic}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom bar */}
              <div className="px-4 py-2 border-t border-cx-border/40 bg-cx-card/20 flex items-center justify-between">
                <span className="text-[9px] text-cx-textGhost">
                  {animStep >= 3 ? "Simulation complete" : "Watching manipulation escalate..."}
                </span>
                <Link href="/simulator" className="text-[9px] font-semibold text-cx-accent hover:text-cx-accentHover transition-colors">
                  Open full lab →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}