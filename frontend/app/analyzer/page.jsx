"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { analyzeMessage, analyzeBatch, downloadReport } from "@/lib/api";

/* ═══════════════════════════════════════════════════════════════
   CONFIGURATION
   ═══════════════════════════════════════════════════════════════ */

const PROFILES = [
  { id: "general", label: "General" },
  { id: "student", label: "Student" },
  { id: "elderly", label: "Elderly" },
  { id: "business_owner", label: "Business" },
];

const RISK = {
  Low: {
    color: "#10B981",
    glow: "rgba(16,185,129,0.08)",
    bg: "rgba(16,185,129,0.06)",
    headline: "No Significant Fraud Patterns Detected",
    sub: "This message does not exhibit known scam indicators. Always verify independently.",
    badge: "LOW",
  },
  Medium: {
    color: "#F59E0B",
    glow: "rgba(245,158,11,0.08)",
    bg: "rgba(245,158,11,0.06)",
    headline: "Moderate Risk — Proceed With Caution",
    sub: "This message contains patterns that warrant verification before acting.",
    badge: "MODERATE",
  },
  High: {
    color: "#F97316",
    glow: "rgba(249,115,22,0.08)",
    bg: "rgba(249,115,22,0.06)",
    headline: "High Risk — Verification Strongly Recommended",
    sub: "Strong fraud indicators detected. Do not act without independent verification.",
    badge: "HIGH",
  },
  Critical: {
    color: "#EF4444",
    glow: "rgba(239,68,68,0.08)",
    bg: "rgba(239,68,68,0.06)",
    headline: "Critical Fraud Pattern Detected",
    sub: "Do not respond, click any links, or share any information from this message.",
    badge: "CRITICAL",
  },
};

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "highlights", label: "Highlights" },
  { id: "psychology", label: "Psychology" },
  { id: "urls", label: "URLs" },
  { id: "actions", label: "Actions" },
];

const CAT_LABELS = {
  urgency: "Urgency pressure detected",
  fear: "Fear-based manipulation",
  otp: "OTP / credential harvesting attempt",
  personal_data: "Personal data solicitation",
  authority_impersonation: "Suspicious authority impersonation",
  reward_scam: "Reward / lottery scam pattern",
  kyc_scam: "KYC fraud pattern",
  financial_data_request: "Financial data request detected",
  dynamic_urgency: "Dynamic time-pressure tactic",
  social_impersonation: "Social / family impersonation",
  suspicious_url: "Suspicious URL identified",
  hindi_urgency: "Urgency pressure (Hindi)",
  hindi_fear: "Fear manipulation (Hindi)",
  hindi_otp_personal: "OTP solicitation (Hindi)",
  hindi_reward: "Reward scam (Hindi)",
  hindi_authority: "Authority impersonation (Hindi)",
  call_transcript: "Call scam transcript patterns",
  Fear: "Fear-based psychological manipulation",
  Urgency: "Urgency-based psychological pressure",
  Authority: "Authority exploitation",
  Reward: "Reward-based luring",
  Scarcity: "Scarcity pressure tactic",
  "Emotional Manipulation": "Emotional manipulation detected",
  "Financial Pressure": "Financial pressure tactic",
  "Financial Coercion": "Financial coercion detected",
};

const PSYCH_EXPLAIN = {
  Fear: {
    why: "Creates panic to override rational decision-making. Victims act before thinking.",
    impact: "Bypasses verification instincts. Increases compliance with fraudulent demands.",
  },
  Urgency: {
    why: "Artificial time constraints prevent the victim from consulting others or verifying.",
    impact: "Reduces deliberation time. Exploits loss aversion and FOMO.",
  },
  Authority: {
    why: "Impersonating banks, police, or government exploits ingrained trust in institutions.",
    impact: "Victims assume legitimacy. Skepticism is suppressed by perceived authority.",
  },
  "Financial Pressure": {
    why: "Implying monetary loss creates immediate emotional distress and urgency.",
    impact: "Victims prioritize preventing perceived financial damage over security verification.",
  },
  "Financial Coercion": {
    why: "Threatens financial consequences like account closure, invoice penalties, or payment failure.",
    impact: "Creates compounding anxiety. Victims comply to avoid cascading consequences.",
  },
  "Emotional Manipulation": {
    why: "Exploits family bonds and personal relationships to bypass skepticism.",
    impact: "Trust in the impersonated person overrides verification habits.",
  },
  Reward: {
    why: "Promises of prizes or money exploit greed and optimism bias.",
    impact: "Victims believe they have nothing to lose by engaging. Data is harvested.",
  },
  Scarcity: {
    why: "False scarcity creates fear of missing out on a perceived opportunity.",
    impact: "Accelerates decision-making. Prevents comparison or verification.",
  },
};

/* Loading step sequence */
const LOAD_STEPS = [
  "Initializing rule engine...",
  "Scanning keyword patterns...",
  "Running AI semantic model...",
  "Evaluating psychological patterns...",
  "Computing risk fusion...",
  "Generating assessment...",
];

/* ═══════════════════════════════════════════════════════════════
   PAGE COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export default function AnalyzerPage() {
  const [msg, setMsg] = useState("");
  const [profile, setProfile] = useState("general");
  const [aiOn, setAiOn] = useState(true);
  const [batch, setBatch] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [loading, setLoading] = useState(false);
  const [loadStep, setLoadStep] = useState(0);
  const [err, setErr] = useState(null);
  const [result, setResult] = useState(null);
  const [batchRes, setBatchRes] = useState(null);
  const [batchIdx, setBatchIdx] = useState(0);
  const [tab, setTab] = useState("overview");

  // Voice
  const [listening, setListening] = useState(false);
  const [voiceOk, setVoiceOk] = useState(true);
  const [voiceErr, setVoiceErr] = useState(null);

  // Animated score
  const [displayScore, setDisplayScore] = useState(0);

  const resultRef = useRef(null);
  const loadTimer = useRef(null);

  const onTranscript = useCallback(
    (t) => setMsg((p) => (p.trim() ? p + " " + t : t)),
    []
  );

  // Animate score counter
  const d = batchRes ? batchRes[batchIdx] : result;
  const targetScore = d?.final_assessment?.final_score ?? 0;

  useEffect(() => {
    if (!d) { setDisplayScore(0); return; }
    let frame;
    let start = null;
    const duration = 1200;
    const from = 0;
    const to = targetScore;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisplayScore(Math.round(from + (to - from) * ease));
      if (p < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [targetScore, d]);

  // Loading step sequence
  useEffect(() => {
    if (loading) {
      setLoadStep(0);
      let i = 0;
      loadTimer.current = setInterval(() => {
        i++;
        if (i < LOAD_STEPS.length) setLoadStep(i);
        else clearInterval(loadTimer.current);
      }, 600);
    } else {
      clearInterval(loadTimer.current);
    }
    return () => clearInterval(loadTimer.current);
  }, [loading]);

  // Scroll to results
  useEffect(() => {
    if (d && resultRef.current) {
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 200);
    }
  }, [d]);

  const doAnalyze = async () => {
    if (!msg.trim() || loading) return;
    setLoading(true);
    setErr(null);
    setResult(null);
    setBatchRes(null);
    setBatchIdx(0);
    setTab("overview");

    try {
      if (batch) {
        const r = await analyzeBatch(msg.trim(), profile, aiOn);
        setBatchRes(r.results);
      } else {
        const r = await analyzeMessage(msg.trim(), profile, aiOn);
        setResult(r.data);
      }
    } catch (e) {
      setErr(e.message || "Analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  const toggleVoice = () => {
    if (typeof window === "undefined") return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setVoiceOk(false); return; }
    if (listening) { window._sRec?.stop(); setListening(false); return; }
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = "en-IN";
    rec.onresult = (e) => {
      let t = "";
      for (let i = e.resultIndex; i < e.results.length; i++)
        if (e.results[i].isFinal) t += e.results[i][0].transcript;
      if (t.trim()) onTranscript(t.trim());
    };
    rec.onerror = (e) => {
      setListening(false);
      setVoiceErr(e.error === "not-allowed" ? "Microphone access denied." : `Error: ${e.error}`);
      setTimeout(() => setVoiceErr(null), 4000);
    };
    rec.onend = () => setListening(false);
    try { rec.start(); window._sRec = rec; setListening(true); setVoiceErr(null); }
    catch { setVoiceErr("Could not start voice input."); }
  };

  const rc = d ? RISK[d.final_assessment?.risk_level] || RISK.Low : null;
  const allCats = d
    ? [...(d.rule_analysis?.categories || []), ...(d.psych_analysis?.categories || [])]
        .filter((v, i, a) => a.indexOf(v) === i)
    : [];

  const batchCount = batch ? msg.split("\n").filter((l) => l.trim()).length : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page header */}
      <div className="mb-10">
        <h1 className="text-[1.75rem] font-extrabold text-cx-text tracking-tight">
          Threat Analyzer
        </h1>
        <p className="text-[13px] text-cx-textDim mt-1">
          Paste suspicious communications for real-time risk intelligence.
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════
          LAYER 1 — INPUT CONSOLE
          ═══════════════════════════════════════════════════════ */}
      <section className="mb-8">
        <div className="bg-cx-deep border border-cx-border rounded-2xl overflow-hidden">
          {/* Terminal header bar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-cx-border/60 bg-cx-surface/40">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-risk-crit/50" />
              <span className="w-2 h-2 rounded-full bg-risk-med/50" />
              <span className="w-2 h-2 rounded-full bg-risk-low/50" />
              <span className="text-[10px] font-mono text-cx-textGhost ml-2">
                threat-input
              </span>
            </div>
            <div className="flex items-center gap-3">
              {/* Batch toggle */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <span className="text-[10px] text-cx-textGhost">Batch</span>
                <button
                  onClick={() => setBatch(!batch)}
                  className={`relative w-8 h-[18px] rounded-full transition-colors ${
                    batch ? "bg-cx-accent" : "bg-cx-border"
                  }`}
                >
                  <span
                    className={`absolute top-[2px] left-[2px] w-[14px] h-[14px] bg-white rounded-full transition-transform shadow-sm ${
                      batch ? "translate-x-[14px]" : ""
                    }`}
                  />
                </button>
              </label>
              {batch && batchCount > 0 && (
                <span className="text-[9px] font-mono text-cx-accent bg-cx-accentGlow px-2 py-0.5 rounded">
                  {batchCount} msg{batchCount !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>

          {/* Textarea */}
          <div className="relative">
            <textarea
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                  e.preventDefault();
                  doAnalyze();
                }
              }}
              disabled={loading}
              rows={7}
              placeholder={
                batch
                  ? "Paste multiple messages, one per line..."
                  : "Paste suspicious SMS, WhatsApp message, or call transcript..."
              }
              className="w-full bg-cx-base border-none px-5 py-4 text-[13px] text-cx-text placeholder-cx-textGhost resize-none disabled:opacity-30 font-mono leading-relaxed focus:ring-0 focus:outline-none"
              style={{ caretColor: "#3B82F6" }}
            />
            <span className="absolute bottom-3 right-4 text-[9px] font-mono text-cx-textGhost">
              {msg.length}
            </span>
          </div>

          {/* Action bar */}
          <div className="px-5 py-4 border-t border-cx-border/40 bg-cx-surface/20">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Primary CTA */}
              <button
                onClick={doAnalyze}
                disabled={!msg.trim() || loading}
                className="flex-1 sm:flex-none sm:min-w-[200px] py-3 bg-cx-accent hover:bg-cx-accentHover disabled:bg-cx-border disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all btn-press shadow-lg shadow-cx-accent/15 hover:shadow-cx-accent/25"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Analyzing...
                  </span>
                ) : (
                  "Analyze Threat"
                )}
              </button>

              {/* Secondary ghost buttons */}
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="px-4 py-2.5 text-[11px] font-medium text-cx-textDim hover:text-cx-textSec border border-cx-border hover:border-cx-borderLight rounded-xl transition-all"
              >
                {showAdvanced ? "Hide Controls" : "Advanced Controls"}
              </button>
            </div>

            {/* Collapsible advanced controls */}
            {showAdvanced && (
              <div className="mt-4 pt-4 border-t border-cx-border/30 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                {/* Left: Voice + Upload */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {voiceOk ? (
                      <button
                        onClick={toggleVoice}
                        disabled={loading}
                        className={`px-3 py-2 rounded-xl text-[10px] font-medium transition-all btn-press ${
                          listening
                            ? "bg-risk-critGlow text-risk-crit border border-risk-crit/20"
                            : "bg-cx-card border border-cx-border text-cx-textDim hover:text-cx-textSec hover:border-cx-borderLight"
                        } disabled:opacity-30`}
                      >
                        {listening ? (
                          <span className="flex items-center gap-1.5">
                            <span className="relative flex h-2 w-2">
                              <span className="listening-dot absolute inline-flex h-full w-full rounded-full bg-risk-crit" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-risk-crit" />
                            </span>
                            Listening — tap to stop
                          </span>
                        ) : (
                          "Use Microphone"
                        )}
                      </button>
                    ) : (
                      <span className="text-[10px] text-cx-textGhost">
                        Voice input not available in this browser
                      </span>
                    )}
                    <span className="text-[10px] text-cx-textGhost border border-cx-border/40 rounded-xl px-2.5 py-1.5">
                      Audio upload — coming soon
                    </span>
                  </div>
                  {voiceErr && (
                    <p className="text-[10px] text-risk-crit">{voiceErr}</p>
                  )}
                </div>

                {/* Right: Profile + AI toggle */}
                <div className="space-y-3">
                  <div>
                    <span className="text-[9px] font-semibold text-cx-textGhost uppercase tracking-wider block mb-1.5">
                      Risk Profile
                    </span>
                    <div className="flex gap-1.5">
                      {PROFILES.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setProfile(p.id)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all ${
                            profile === p.id
                              ? "bg-cx-accentGlow text-cx-accent border border-cx-accent/20"
                              : "bg-cx-card border border-cx-border text-cx-textDim hover:text-cx-textSec"
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-cx-card border border-cx-border rounded-xl px-3 py-2">
                    <span className="text-[10px] font-medium text-cx-textSec">
                      AI Semantic Analysis
                    </span>
                    <button
                      onClick={() => setAiOn(!aiOn)}
                      className={`relative w-8 h-[18px] rounded-full transition-colors ${
                        aiOn ? "bg-cx-violet" : "bg-cx-border"
                      }`}
                    >
                      <span
                        className={`absolute top-[2px] left-[2px] w-[14px] h-[14px] bg-white rounded-full transition-transform shadow-sm ${
                          aiOn ? "translate-x-[14px]" : ""
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <p className="text-[9px] text-cx-textGhost mt-2 text-right">
          Ctrl+Enter to analyze
        </p>
      </section>

      {/* ═══════════════════════════════════════════════════════
          LOADING STATE
          ═══════════════════════════════════════════════════════ */}
      {loading && (
        <section className="mb-8 animate-fade-in">
          <div className="bg-cx-card border border-cx-border rounded-2xl p-8">
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-14 h-14">
                <div className="absolute inset-0 border-2 border-cx-border rounded-full" />
                <div className="absolute inset-0 border-2 border-cx-accent border-t-transparent rounded-full animate-spin" />
              </div>
              <div className="text-center space-y-1.5">
                {LOAD_STEPS.map((step, i) => (
                  <p
                    key={i}
                    className={`text-[11px] font-mono transition-all duration-500 ${
                      i <= loadStep
                        ? i === loadStep
                          ? "text-cx-accent"
                          : "text-cx-textDim"
                        : "text-cx-textGhost/30"
                    }`}
                  >
                    {i < loadStep ? "✓" : i === loadStep ? "›" : " "} {step}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Error */}
      {err && (
        <section className="mb-8 animate-fade-in">
          <div className="bg-risk-critGlow border border-risk-crit/15 rounded-2xl p-5 flex items-start justify-between">
            <p className="text-sm text-risk-crit">{err}</p>
            <button
              onClick={() => setErr(null)}
              className="text-risk-crit/40 hover:text-risk-crit text-lg ml-4"
            >
              ×
            </button>
          </div>
        </section>
      )}

      {/* Batch selector */}
      {batchRes && batchRes.length > 0 && (
        <section className="mb-6 animate-fade-in">
          <div className="bg-cx-card border border-cx-border rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold text-cx-textGhost uppercase tracking-wider">
                Batch Results
              </span>
              <span className="text-[10px] font-mono text-cx-textDim">
                {batchRes.length} analyzed
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {batchRes.map((r, i) => {
                const l = r?.final_assessment?.risk_level || "Low";
                const c = RISK[l] || RISK.Low;
                return (
                  <button
                    key={i}
                    onClick={() => { setBatchIdx(i); setTab("overview"); }}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all btn-press ${
                      batchIdx === i ? "ring-1 ring-cx-accent ring-offset-1 ring-offset-cx-base" : ""
                    }`}
                    style={{ backgroundColor: c.glow, color: c.color }}
                  >
                    #{i + 1}{" "}
                    {r?.error
                      ? "Error"
                      : `${c.badge} ${r?.final_assessment?.final_score}`}
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════
          LAYER 2 — RISK DISPLAY
          ═══════════════════════════════════════════════════════ */}
      {d && !d.error && !loading && (
        <div ref={resultRef} className="space-y-6 animate-slide-up">
          <section className="bg-cx-card border border-cx-border rounded-2xl overflow-hidden">
            {/* Color bar */}
            <div className="h-1" style={{ backgroundColor: rc.color }} />

            <div className="p-8">
              {/* Headline */}
              <div className="mb-8">
                <h2 className="text-xl font-extrabold text-cx-text tracking-tight mb-1">
                  {d.final_assessment.risk_level === "Critical" && (
                    <span className="text-risk-crit mr-1.5">⚠</span>
                  )}
                  {rc.headline}
                </h2>
                <p className="text-[13px] text-cx-textSec">{rc.sub}</p>
              </div>

              {/* Gauge + breakdown */}
              <div className="flex flex-col lg:flex-row items-center lg:items-start gap-10">
                {/* Gauge */}
                <div className="flex-shrink-0 relative w-44 h-44">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle
                      cx="50" cy="50" r="42"
                      fill="none" stroke="#1E293B" strokeWidth="5"
                    />
                    <circle
                      cx="50" cy="50" r="42"
                      fill="none" stroke={rc.color} strokeWidth="5"
                      strokeLinecap="round"
                      strokeDasharray={264}
                      strokeDashoffset={264 * (1 - d.final_assessment.final_score / 100)}
                      className="animate-gauge"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span
                      className="text-5xl font-black tabular-nums"
                      style={{ color: rc.color }}
                    >
                      {displayScore}
                    </span>
                    <span className="text-[9px] text-cx-textGhost font-mono mt-0.5">
                      / 100
                    </span>
                  </div>
                </div>

                <div className="flex-1 w-full space-y-5">
                  {/* Score bars */}
                  <div className="space-y-2.5">
                    <ScoreBar label="Rule Engine" value={d.rule_analysis.score} color="#3B82F6" />
                    <ScoreBar
                      label="AI Model"
                      value={d.ai_analysis.enabled ? Math.round(d.ai_analysis.probability * 100) : 0}
                      color="#8B5CF6"
                      off={!d.ai_analysis.enabled}
                    />
                    <ScoreBar label="Psychology" value={d.psych_analysis.score} color="#EC4899" />
                  </div>

                  {/* Agreement badge */}
                  <div className="flex items-center gap-2 pt-2">
                    <AgreementBadge type={d.final_assessment.agreement_type} />
                    <span className="text-[9px] text-cx-textGhost">
                      Agreement: {d.final_assessment.agreement_level}
                    </span>
                  </div>
                </div>
              </div>

              {/* ═══ WHY THIS WAS FLAGGED ═══ */}
              {allCats.length > 0 && (
                <div className="mt-8 pt-6 border-t border-cx-border">
                  <h3 className="text-[11px] font-bold text-cx-textSec uppercase tracking-wider mb-3">
                    Why This Was Flagged
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {allCats.map((cat) => (
                      <div
                        key={cat}
                        className="flex items-start gap-2 py-1.5"
                      >
                        <span
                          className="w-1 h-1 rounded-full flex-shrink-0 mt-1.5"
                          style={{ backgroundColor: rc.color }}
                        />
                        <span className="text-[11px] text-cx-textSec leading-snug">
                          {CAT_LABELS[cat] || cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════
              LAYER 3 — DEEP ANALYSIS TABS
              ═══════════════════════════════════════════════════════ */}
          <section className="bg-cx-card border border-cx-border rounded-2xl overflow-hidden">
            {/* Tab bar */}
            <div className="flex border-b border-cx-border relative">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`relative px-5 py-3.5 text-[11px] font-semibold whitespace-nowrap transition-colors ${
                    tab === t.id
                      ? "text-cx-accent"
                      : "text-cx-textDim hover:text-cx-textSec"
                  }`}
                >
                  {t.label}
                  {tab === t.id && (
                    <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-cx-accent rounded-full shadow-[0_0_8px_rgba(59,130,246,0.4)]" />
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="p-6 min-h-[200px]" key={tab}>
              <div className="animate-fade-in">
                {tab === "overview" && <PanelOverview d={d} allCats={allCats} />}
                {tab === "highlights" && <PanelHighlights d={d} />}
                {tab === "psychology" && <PanelPsych d={d} />}
                {tab === "urls" && <PanelUrls d={d} />}
                {tab === "actions" && <PanelActions d={d} />}
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Batch error */}
      {d && d.error && !loading && (
        <div className="bg-risk-critGlow border border-risk-crit/15 rounded-2xl p-5 animate-fade-in">
          <p className="text-sm text-risk-crit font-semibold">Analysis failed</p>
          <p className="text-[11px] text-cx-textDim mt-1">{d.error}</p>
        </div>
      )}

      {/* Empty state */}
      {!d && !loading && !err && (
        <section className="animate-fade-in">
          <div className="bg-cx-card border border-cx-border rounded-2xl p-16 text-center">
            <div className="w-16 h-16 bg-cx-surface rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg
                width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="#475569" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <p className="text-sm text-cx-textSec">
              Paste a suspicious message above to begin analysis.
            </p>
            <p className="text-[10px] text-cx-textGhost mt-1">
              Full risk intelligence will appear here.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

function ScoreBar({ label, value, color, off }) {
  return (
    <div>
      <div className="flex justify-between text-[10px] mb-1">
        <span className="text-cx-textDim">
          {label}
          {off && <span className="text-cx-textGhost ml-1">(disabled)</span>}
        </span>
        <span className="font-mono text-cx-textSec">{off ? "—" : value}</span>
      </div>
      <div className="w-full h-1.5 bg-cx-base rounded-full overflow-hidden">
        <div
          className="h-full rounded-full animate-bar-grow"
          style={{
            width: off ? "0%" : `${value}%`,
            backgroundColor: color,
            boxShadow: off ? "none" : `0 0 6px ${color}30`,
          }}
        />
      </div>
    </div>
  );
}

function AgreementBadge({ type }) {
  const config = {
    RULE_DOMINANT: { label: "Rule-Dominant", bg: "rgba(59,130,246,0.08)", color: "#3B82F6" },
    AI_DOMINANT: { label: "AI-Dominant", bg: "rgba(139,92,246,0.08)", color: "#8B5CF6" },
    AI_DOMINANT_ESCALATION: { label: "AI-Escalated", bg: "rgba(139,92,246,0.12)", color: "#8B5CF6" },
    BALANCED: { label: "Balanced", bg: "rgba(16,185,129,0.08)", color: "#10B981" },
  };
  const c = config[type] || config.BALANCED;
  return (
    <span
      className="text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
      style={{ backgroundColor: c.bg, color: c.color }}
    >
      {c.label}
    </span>
  );
}

/* ── OVERVIEW ── */
function PanelOverview({ d, allCats }) {
  return (
    <div className="space-y-5">
      {/* Flags */}
      <div className="flex flex-wrap gap-1.5">
        <FlagPill label="OTP" on={d.rule_analysis.flags.has_otp} />
        <FlagPill label="Suspicious URL" on={d.rule_analysis.flags.has_suspicious_url} />
        <FlagPill label="Money Request" on={d.rule_analysis.flags.has_money_request} />
        {d.rule_analysis.flags.has_financial_request !== undefined && (
          <FlagPill label="Financial Request" on={d.rule_analysis.flags.has_financial_request} />
        )}
        {d.rule_analysis.flags.has_dynamic_urgency !== undefined && (
          <FlagPill label="Time Pressure" on={d.rule_analysis.flags.has_dynamic_urgency} />
        )}
      </div>

      {/* Score grid */}
      <div className="bg-cx-base/50 rounded-xl border border-cx-border/40 p-4">
        <div className="grid grid-cols-2 gap-y-2 gap-x-8 text-[10px]">
          <span className="text-cx-textDim">Rule Score (adjusted)</span>
          <span className="text-cx-text font-mono text-right">{d.rule_analysis.score}</span>
          <span className="text-cx-textDim">Rule Score (original)</span>
          <span className="text-cx-text font-mono text-right">{d.rule_analysis.original_score}</span>
          <span className="text-cx-textDim">Psych Score (adjusted)</span>
          <span className="text-cx-text font-mono text-right">{d.psych_analysis.score}</span>
          <span className="text-cx-textDim">Psych Score (original)</span>
          <span className="text-cx-text font-mono text-right">{d.psych_analysis.original_score}</span>
          <span className="text-cx-textDim">AI Probability</span>
          <span className="text-cx-text font-mono text-right">{(d.ai_analysis.probability * 100).toFixed(1)}%</span>
          <span className="text-cx-textDim">AI Confidence</span>
          <span className="text-cx-text font-mono text-right">{(d.ai_analysis.confidence * 100).toFixed(1)}%</span>
          <span className="text-cx-textDim">AI Label</span>
          <span className="text-cx-text font-mono text-right">{d.ai_analysis.label}</span>
          <span className="text-cx-textDim">Profile</span>
          <span className="text-cx-text font-mono text-right capitalize">{d.profile_adjustment.profile_used}</span>
        </div>
      </div>
    </div>
  );
}

/* ── HIGHLIGHTS ── */
function PanelHighlights({ d }) {
  const hl = d.highlights || [];
  if (!hl.length)
    return <p className="text-sm text-cx-textDim">No suspicious phrases detected in this message.</p>;

  const sorted = [...hl].sort((a, b) => a.start - b.start);
  const merged = [];
  for (const h of sorted) {
    if (!merged.length || h.start >= merged[merged.length - 1].end) merged.push(h);
  }

  const segs = [];
  let cur = 0;
  for (const h of merged) {
    if (h.start > cur) segs.push({ t: "p", text: d.message.slice(cur, h.start) });
    segs.push({ t: "h", text: d.message.slice(h.start, h.end), color: h.color, cat: h.category });
    cur = h.end;
  }
  if (cur < d.message.length) segs.push({ t: "p", text: d.message.slice(cur) });

  const [hoveredCat, setHoveredCat] = useState(null);

  return (
    <div className="space-y-4">
      <p className="text-[12px] leading-[1.8] whitespace-pre-wrap font-mono">
        {segs.map((s, i) =>
          s.t === "p" ? (
            <span key={i} className="text-cx-textSec">{s.text}</span>
          ) : (
            <span
              key={i}
              className="relative font-semibold rounded-sm px-0.5 cursor-help transition-all duration-300 hover:brightness-125 group"
              style={{
                backgroundColor: `${s.color}15`,
                color: s.color,
                textShadow: `0 0 8px ${s.color}20`,
              }}
              onMouseEnter={() => setHoveredCat(s.cat)}
              onMouseLeave={() => setHoveredCat(null)}
            >
              {s.text}
              {/* Tooltip */}
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-cx-surface border border-cx-border rounded-lg text-[9px] text-cx-textSec whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-xl z-10">
                {CAT_LABELS[s.cat] || s.cat.replace(/_/g, " ")}
              </span>
            </span>
          )
        )}
      </p>
      <div className="flex flex-wrap gap-1.5 pt-3 border-t border-cx-border">
        {[...new Set(merged.map((h) => h.category))].map((cat) => {
          const cl = merged.find((h) => h.category === cat)?.color;
          return (
            <span
              key={cat}
              className={`text-[9px] font-medium px-2 py-0.5 rounded transition-all ${
                hoveredCat === cat ? "ring-1 ring-offset-1 ring-offset-cx-base" : ""
              }`}
              style={{ backgroundColor: `${cl}12`, color: cl, ringColor: cl }}
            >
              {cat.replace(/_/g, " ")}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/* ── PSYCHOLOGY ── */
function PanelPsych({ d }) {
  const cats = d.psych_analysis.categories;
  if (!cats.length)
    return <p className="text-sm text-cx-textDim">No psychological manipulation tactics detected.</p>;

  return (
    <div className="space-y-3">
      {cats.map((cat) => {
        const info = PSYCH_EXPLAIN[cat];
        return (
          <div
            key={cat}
            className="bg-cx-base/50 border border-cx-border/40 rounded-xl p-4 space-y-2"
          >
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cx-violet flex-shrink-0" />
              <h4 className="text-[12px] font-bold text-cx-text">{cat}</h4>
            </div>
            {info ? (
              <>
                <div className="pl-3.5">
                  <p className="text-[10px] text-cx-textSec leading-relaxed">
                    <span className="text-cx-textDim font-semibold">Why it works: </span>
                    {info.why}
                  </p>
                  <p className="text-[10px] text-cx-textSec leading-relaxed mt-1">
                    <span className="text-cx-textDim font-semibold">Behavioral impact: </span>
                    {info.impact}
                  </p>
                </div>
              </>
            ) : (
              <p className="text-[10px] text-cx-textDim pl-3.5">
                Psychological manipulation tactic identified in the message.
              </p>
            )}
          </div>
        );
      })}
      <p className="text-[9px] text-cx-textGhost font-mono pt-2 border-t border-cx-border">
        Psychological Score: {d.psych_analysis.score}/100
      </p>
    </div>
  );
}

/* ── URLS ── */
function PanelUrls({ d }) {
  const u = d.rule_analysis.url_analysis;
  if (!u.suspicious_urls.length)
    return <p className="text-sm text-cx-textDim">No suspicious URLs detected in this message.</p>;

  return (
    <div className="space-y-3">
      {u.suspicious_urls.map((url, i) => (
        <div
          key={i}
          className="bg-cx-base/50 border-l-2 border-risk-crit rounded-r-xl p-4 space-y-2"
        >
          <p className="text-[12px] text-risk-crit font-mono font-semibold break-all">
            {url}
          </p>
          <div className="space-y-1">
            <p className="text-[9px] font-semibold text-cx-textGhost uppercase tracking-wider">
              Risk Indicators
            </p>
            {u.reasons.map((r, j) => (
              <div key={j} className="flex items-start gap-1.5">
                <span className="w-1 h-1 rounded-full bg-risk-crit flex-shrink-0 mt-1" />
                <p className="text-[10px] text-cx-textSec">{r}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
      <p className="text-[9px] text-cx-textGhost font-mono pt-2 border-t border-cx-border">
        URL Threat Score: {u.url_score}
      </p>
    </div>
  );
}

/* ── ACTIONS ── */
function PanelActions({ d }) {
  const tips = d.safety_tips || [];
  const urgent = tips.slice(0, Math.ceil(tips.length / 2));
  const preventive = tips.slice(Math.ceil(tips.length / 2));

  return (
    <div className="space-y-6">
      {tips.length > 0 ? (
        <>
          {/* Immediate */}
          <div>
            <h4 className="text-[10px] font-bold text-risk-crit uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-risk-crit" />
              Immediate Actions
            </h4>
            <ul className="space-y-2">
              {urgent.map((tip, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-4 h-4 bg-risk-critGlow rounded flex items-center justify-center mt-0.5">
                    <span className="text-[8px] font-bold text-risk-crit">{i + 1}</span>
                  </span>
                  <p className="text-[11px] text-cx-textSec leading-relaxed">{tip}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Preventive */}
          {preventive.length > 0 && (
            <div>
              <h4 className="text-[10px] font-bold text-cx-accent uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cx-accent" />
                Preventive Guidance
              </h4>
              <ul className="space-y-2">
                {preventive.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="flex-shrink-0 w-4 h-4 bg-cx-accentGlow rounded flex items-center justify-center mt-0.5">
                      <span className="text-[8px] font-bold text-cx-accent">
                        {urgent.length + i + 1}
                      </span>
                    </span>
                    <p className="text-[11px] text-cx-textSec leading-relaxed">{tip}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        <p className="text-sm text-cx-textDim">No specific recommendations for this message.</p>
      )}

      {/* Download */}
      <div className="pt-4 border-t border-cx-border">
        <DownloadBtn id={d.id} />
      </div>
    </div>
  );
}

function DownloadBtn({ id }) {
  const [dl, setDl] = useState(false);
  const [e, setE] = useState(null);
  const go = async () => {
    if (!id) return;
    setDl(true); setE(null);
    try {
      const b = await downloadReport(id);
      const u = URL.createObjectURL(b);
      const a = document.createElement("a");
      a.href = u; a.download = `suraksha_report_${id}.pdf`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(u);
    } catch (x) { setE(x.message); }
    finally { setDl(false); }
  };
  return (
    <div>
      <button
        onClick={go}
        disabled={dl || !id}
        className="px-5 py-2.5 bg-cx-surface border border-cx-border rounded-xl text-[11px] font-semibold text-cx-textDim hover:text-cx-textSec hover:border-cx-borderLight transition-all btn-press disabled:opacity-30"
      >
        {dl ? "Generating Report..." : "Download Intelligence Report"}
      </button>
      {e && <p className="text-[9px] text-risk-crit mt-1">{e}</p>}
    </div>
  );
}

function FlagPill({ label, on }) {
  return (
    <span
      className={`text-[9px] font-semibold px-2.5 py-0.5 rounded-full ${
        on
          ? "bg-risk-critGlow text-risk-crit"
          : "bg-cx-surface text-cx-textGhost"
      }`}
    >
      {label}
    </span>
  );
}