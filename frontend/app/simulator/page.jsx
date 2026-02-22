"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import SIMULATIONS from "@/lib/simulations";

/* ═══════════════════════════════════════════════════════════
   ICONS
   ═══════════════════════════════════════════════════════════ */
const ICONS = {
  bank: <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" />,
  key: <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />,
  receipt: <path d="M9 5H7a2 2 0 00-2 2v12l3-3 3 3 3-3 3 3V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />,
  users: <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zm14 10v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />,
  trending: <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />,
  briefcase: <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />,
  shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
};

function Icon({ name, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {ICONS[name] || ICONS.shield}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════
   RISK BAR COLORS
   ═══════════════════════════════════════════════════════════ */
function riskColor(score) {
  if (score <= 30) return "#10B981";
  if (score <= 60) return "#F59E0B";
  if (score <= 80) return "#F97316";
  return "#EF4444";
}

function riskLabel(score) {
  if (score <= 30) return "Low";
  if (score <= 60) return "Medium";
  if (score <= 80) return "High";
  return "Critical";
}

/* ═══════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════ */
export default function SimulatorPage() {
  const router = useRouter();
  const [activeId, setActiveId] = useState(SIMULATIONS[0].id);
  const [stepIdx, setStepIdx] = useState(0);
  const [revealedSteps, setRevealedSteps] = useState([0]);
  const [interventionMode, setInterventionMode] = useState(false);
  const [selectedBreak, setSelectedBreak] = useState(null);
  const [typing, setTyping] = useState(false);
  const chatEndRef = useRef(null);

  const sim = SIMULATIONS.find((s) => s.id === activeId);
  const currentStep = sim.steps[stepIdx];
  const visibleSteps = sim.steps.filter((_, i) => revealedSteps.includes(i));

  // Reset on scenario change
  useEffect(() => {
    setStepIdx(0);
    setRevealedSteps([0]);
    setInterventionMode(false);
    setSelectedBreak(null);
    setTyping(false);
  }, [activeId]);

  // Scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [revealedSteps]);

  const advanceStep = () => {
    if (stepIdx >= sim.steps.length - 1) {
      setInterventionMode(true);
      return;
    }
    setTyping(true);
    setTimeout(() => {
      const next = stepIdx + 1;
      setStepIdx(next);
      setRevealedSteps((prev) => [...prev, next]);
      setTyping(false);
    }, 800);
  };

  const handleBreakSelect = (idx) => {
    setSelectedBreak(idx);
  };

  const buildAnalyzerMessage = () => {
    return sim.steps.filter((s) => s.sender === "scammer").map((s) => s.message).join(" ");
  };

  const testInAnalyzer = () => {
    const msg = encodeURIComponent(buildAnalyzerMessage());
    router.push(`/analyzer?msg=${msg}`);
  };

  return (
    <div className="min-h-screen">
      {/* ═══ HERO ═══ */}
      <section className="relative py-20 px-4 overflow-hidden">
        {/* Grid bg */}
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: "linear-gradient(rgba(148,163,184,0.2) 1px,transparent 1px),linear-gradient(90deg,rgba(148,163,184,0.2) 1px,transparent 1px)",
          backgroundSize: "40px 40px",
        }} />
        <div className="absolute top-10 right-[20%] w-72 h-72 bg-cx-accent/[0.03] rounded-full blur-3xl animate-float-a" />
        <div className="absolute bottom-10 left-[10%] w-96 h-96 bg-cx-violet/[0.03] rounded-full blur-3xl animate-float-b" />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-cx-card/50 border border-cx-border/50 rounded-full text-[10px] text-cx-textDim mb-6 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 bg-cx-violet rounded-full" />
            Interactive Training Environment
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-cx-text tracking-tight leading-[1.1] mb-4">
            Understand Scams Before<br />
            <span className="text-cx-accent">They Understand You</span>
          </h1>
          <p className="text-sm sm:text-base text-cx-textSec max-w-xl mx-auto leading-relaxed">
            Step inside real-world fraud scenarios. See how manipulation unfolds,
            identify the breaking points, and learn to interrupt the scam chain.
          </p>
        </div>
      </section>

      {/* ═══ SCENARIO SELECTOR ═══ */}
      <section className="px-4 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {SIMULATIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveId(s.id)}
                className={`flex-shrink-0 flex items-center gap-2.5 px-4 py-3 rounded-xl text-[12px] font-semibold transition-all btn-press ${
                  activeId === s.id
                    ? "bg-cx-accentGlow text-cx-accent border border-cx-accent/20 shadow-lg shadow-cx-accent/10"
                    : "bg-cx-card border border-cx-border text-cx-textDim hover:text-cx-textSec hover:border-cx-borderLight"
                }`}
              >
                <span className={activeId === s.id ? "text-cx-accent" : "text-cx-textGhost"}>
                  <Icon name={s.icon} size={15} />
                </span>
                {s.short}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SIMULATION PANEL ═══ */}
      <section className="px-4 sm:px-6 lg:px-8 pb-12">
        <div className="max-w-6xl mx-auto">
          {/* Scenario description */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-cx-text mb-1">{sim.title}</h2>
            <p className="text-[12px] text-cx-textDim">{sim.description}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            {/* LEFT: Chat simulation */}
            <div className="lg:col-span-3">
              <div className="bg-cx-deep border border-cx-border rounded-2xl overflow-hidden flex flex-col" style={{ minHeight: "520px" }}>
                {/* Chat header */}
                <div className="px-5 py-3 border-b border-cx-border/60 bg-cx-surface/30 flex items-center gap-3">
                  <div className="w-8 h-8 bg-cx-card border border-cx-border rounded-full flex items-center justify-center text-cx-textGhost">
                    <Icon name={sim.icon} size={14} />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-cx-text">{sim.title} — Simulation</p>
                    <p className="text-[9px] text-cx-textGhost">Step {stepIdx + 1} of {sim.steps.length}</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-0.5 bg-cx-border">
                  <div
                    className="h-full bg-cx-accent transition-all duration-700 ease-out"
                    style={{ width: `${((stepIdx + 1) / sim.steps.length) * 100}%` }}
                  />
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                  {visibleSteps.map((step, i) => (
                    <div
                      key={i}
                      className={`flex ${step.sender === "victim" ? "justify-end" : "justify-start"} animate-slide-up`}
                      style={{ animationDelay: `${i * 0.05}s` }}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                          step.sender === "victim"
                            ? "bg-cx-accent/10 border border-cx-accent/15 rounded-br-md"
                            : "bg-cx-card border border-cx-border rounded-bl-md"
                        }`}
                      >
                        <p className="text-[10px] font-semibold mb-1" style={{
                          color: step.sender === "victim" ? "#3B82F6" : "#EF4444",
                        }}>
                          {step.sender === "victim" ? "You" : "Scammer"}
                        </p>
                        <p className="text-[12px] text-cx-textSec leading-relaxed">
                          {step.message}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Typing indicator */}
                  {typing && (
                    <div className="flex justify-start animate-fade-in">
                      <div className="bg-cx-card border border-cx-border rounded-2xl rounded-bl-md px-4 py-3">
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 bg-cx-textGhost rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
                          <span className="w-1.5 h-1.5 bg-cx-textGhost rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
                          <span className="w-1.5 h-1.5 bg-cx-textGhost rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Controls */}
                <div className="px-4 py-3 border-t border-cx-border/40 bg-cx-surface/20">
                  {!interventionMode ? (
                    <button
                      onClick={advanceStep}
                      disabled={typing}
                      className="w-full py-2.5 bg-cx-accent hover:bg-cx-accentHover disabled:bg-cx-border text-white text-[12px] font-bold rounded-xl transition-all btn-press disabled:cursor-not-allowed"
                    >
                      {stepIdx >= sim.steps.length - 1
                        ? "Complete Simulation"
                        : `Next Step (${stepIdx + 2}/${sim.steps.length})`}
                    </button>
                  ) : (
                    <div className="text-center">
                      <p className="text-[11px] text-cx-accent font-semibold mb-2">
                        Simulation complete — see intervention analysis
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT: Live analysis */}
            <div className="lg:col-span-2 space-y-4">
              {/* Risk progression */}
              <div className="bg-cx-card border border-cx-border rounded-2xl p-5">
                <h3 className="text-[10px] font-bold text-cx-textGhost uppercase tracking-wider mb-4">
                  Risk Progression
                </h3>
                <div className="space-y-2">
                  {sim.steps.map((step, i) => {
                    const revealed = revealedSteps.includes(i);
                    const c = riskColor(step.riskScore);
                    return (
                      <div key={i} className={`transition-opacity duration-500 ${revealed ? "opacity-100" : "opacity-20"}`}>
                        <div className="flex justify-between text-[9px] mb-0.5">
                          <span className="text-cx-textDim">Step {i + 1}</span>
                          <span className="font-mono font-semibold" style={{ color: revealed ? c : "#475569" }}>
                            {revealed ? step.riskScore : "—"}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-cx-base rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-1000 ease-out"
                            style={{
                              width: revealed ? `${step.riskScore}%` : "0%",
                              backgroundColor: c,
                              boxShadow: revealed ? `0 0 6px ${c}30` : "none",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Current risk badge */}
                <div className="mt-4 pt-3 border-t border-cx-border flex items-center justify-between">
                  <span className="text-[9px] text-cx-textGhost">Current Risk</span>
                  <span
                    className="text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${riskColor(currentStep.riskScore)}12`,
                      color: riskColor(currentStep.riskScore),
                    }}
                  >
                    {riskLabel(currentStep.riskScore)} ({currentStep.riskScore})
                  </span>
                </div>
              </div>

              {/* Active tactics */}
              <div className="bg-cx-card border border-cx-border rounded-2xl p-5">
                <h3 className="text-[10px] font-bold text-cx-textGhost uppercase tracking-wider mb-3">
                  Active Tactics
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {currentStep.tactics.map((t) => (
                    <span
                      key={t}
                      className="px-2.5 py-1 bg-cx-violetGlow text-cx-violet border border-cx-violet/15 rounded-lg text-[10px] font-medium"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Commentary */}
              <div className="bg-cx-card border border-cx-border rounded-2xl p-5">
                <h3 className="text-[10px] font-bold text-cx-textGhost uppercase tracking-wider mb-2">
                  Analysis
                </h3>
                <p className="text-[11px] text-cx-textSec leading-relaxed">
                  {currentStep.commentary}
                </p>
              </div>

              {/* Test in analyzer */}
              <button
                onClick={testInAnalyzer}
                className="w-full py-2.5 bg-cx-surface border border-cx-border rounded-xl text-[11px] font-semibold text-cx-textDim hover:text-cx-accent hover:border-cx-accent/30 transition-all btn-press"
              >
                Test This Scenario in Analyzer →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ INTERVENTION MODE ═══ */}
      {interventionMode && (
        <section className="px-4 sm:px-6 lg:px-8 pb-12 animate-slide-up">
          <div className="max-w-6xl mx-auto">
            <div className="bg-cx-card border border-cx-border rounded-2xl p-6">
              <h3 className="text-sm font-bold text-cx-text mb-1">
                Where Should You Have Stopped This Scam?
              </h3>
              <p className="text-[11px] text-cx-textDim mb-5">
                Click on the step where you think the scam became identifiable.
              </p>

              <div className="flex flex-wrap gap-2 mb-5">
                {sim.steps.map((step, i) => {
                  const isCorrect = i === sim.bestBreakPoint;
                  const isSelected = selectedBreak === i;
                  const c = riskColor(step.riskScore);

                  return (
                    <button
                      key={i}
                      onClick={() => handleBreakSelect(i)}
                      className={`relative px-4 py-3 rounded-xl text-left transition-all btn-press border ${
                        isSelected
                          ? isCorrect
                            ? "border-risk-low bg-risk-lowGlow"
                            : "border-risk-high bg-risk-highGlow"
                          : "border-cx-border bg-cx-surface hover:border-cx-borderLight"
                      }`}
                      style={{ minWidth: "120px" }}
                    >
                      <span className="text-[9px] font-mono text-cx-textGhost block mb-0.5">
                        Step {i + 1}
                      </span>
                      <span className="text-[10px] font-semibold block" style={{ color: c }}>
                        Risk: {step.riskScore}
                      </span>
                      <span className="text-[9px] text-cx-textDim block mt-0.5 truncate max-w-[140px]">
                        {step.sender === "scammer" ? "Scammer" : "You"}: {step.message.slice(0, 30)}...
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Feedback */}
              {selectedBreak !== null && (
                <div className={`rounded-xl p-4 border animate-fade-in ${
                  selectedBreak === sim.bestBreakPoint
                    ? "bg-risk-lowGlow border-risk-low/20"
                    : selectedBreak < sim.bestBreakPoint
                    ? "bg-cx-accentGlow border-cx-accent/20"
                    : "bg-risk-highGlow border-risk-high/20"
                }`}>
                  <p className="text-[12px] font-bold mb-1" style={{
                    color: selectedBreak === sim.bestBreakPoint ? "#10B981"
                      : selectedBreak < sim.bestBreakPoint ? "#3B82F6" : "#F97316",
                  }}>
                    {selectedBreak === sim.bestBreakPoint
                      ? "Correct — this is the optimal breaking point."
                      : selectedBreak < sim.bestBreakPoint
                      ? "Good instinct — even earlier detection shows strong awareness."
                      : "Too late — the manipulation had already escalated. Let's review why."}
                  </p>
                  <p className="text-[11px] text-cx-textSec leading-relaxed">
                    {sim.breakExplanation}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ═══ PSYCHOLOGY BREAKDOWN ═══ */}
      <section className="px-4 sm:px-6 lg:px-8 pb-12">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-xs font-bold text-cx-textSec uppercase tracking-wider mb-4">
            Psychological Breakdown — {sim.title}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sim.psychology.map((p, i) => (
              <div
                key={i}
                className="bg-cx-card border border-cx-border rounded-2xl p-5 card-lift"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-cx-violet" />
                  <h4 className="text-[12px] font-bold text-cx-text">{p.tactic}</h4>
                </div>
                <div className="space-y-2.5">
                  <div>
                    <span className="text-[9px] font-semibold text-cx-textGhost uppercase tracking-wider">
                      Target Emotion
                    </span>
                    <p className="text-[11px] text-cx-accent font-semibold mt-0.5">{p.emotion}</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-semibold text-cx-textGhost uppercase tracking-wider">
                      How It Works
                    </span>
                    <p className="text-[11px] text-cx-textSec leading-relaxed mt-0.5">{p.why}</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-semibold text-cx-textGhost uppercase tracking-wider">
                      Why Victims Comply
                    </span>
                    <p className="text-[11px] text-cx-textSec leading-relaxed mt-0.5">{p.whyWorks}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PREVENTION ═══ */}
      <section className="px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-xs font-bold text-cx-textSec uppercase tracking-wider mb-4">
            Prevention Strategy — {sim.title}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <PreventionBlock
              title="Immediate Actions"
              color="#EF4444"
              items={sim.prevention.immediate}
            />
            <PreventionBlock
              title="Preventive Strategy"
              color="#3B82F6"
              items={sim.prevention.preventive}
            />
            <PreventionBlock
              title="Verification Steps"
              color="#10B981"
              items={sim.prevention.verification}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function PreventionBlock({ title, color, items }) {
  return (
    <div className="bg-cx-card border border-cx-border rounded-2xl p-5 card-lift">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        <h4 className="text-[11px] font-bold text-cx-text">{title}</h4>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <span
              className="flex-shrink-0 w-4 h-4 rounded flex items-center justify-center mt-0.5 text-[8px] font-bold"
              style={{ backgroundColor: `${color}12`, color }}
            >
              {i + 1}
            </span>
            <p className="text-[11px] text-cx-textSec leading-relaxed">{item}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}