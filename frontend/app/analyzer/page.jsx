"use client";

import { useState, useCallback } from "react";
import { analyzeMessage, analyzeBatch } from "@/lib/api";

export default function AnalyzerPage() {
  const [message, setMessage] = useState("");
  const [profile, setProfile] = useState("general");
  const [aiEnabled, setAiEnabled] = useState(true);
  const [isBatchMode, setIsBatchMode] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [batchResults, setBatchResults] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");

  // Voice
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [voiceError, setVoiceError] = useState(null);

  const handleTranscript = useCallback((t) => {
    setMessage((prev) => (prev.trim() ? prev + " " + t : t));
  }, []);

  const handleSubmit = async () => {
    if (!message.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setBatchResults(null);
    setSelectedBatch(0);
    setActiveTab("overview");

    try {
      if (isBatchMode) {
        const res = await analyzeBatch(message.trim(), profile, aiEnabled);
        setBatchResults(res.results);
      } else {
        const res = await analyzeMessage(message.trim(), profile, aiEnabled);
        setResult(res.data);
      }
    } catch (err) {
      setError(err.message || "Analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleVoice = () => {
    if (typeof window === "undefined") return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setVoiceSupported(false); return; }

    if (listening) {
      window._surakshaRecognition?.stop();
      setListening(false);
      return;
    }

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-IN";

    recognition.onresult = (e) => {
      let t = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) t += e.results[i][0].transcript;
      }
      if (t.trim()) handleTranscript(t.trim());
    };

    recognition.onerror = (e) => {
      setListening(false);
      if (e.error === "not-allowed") setVoiceError("Microphone access denied.");
      else setVoiceError(`Voice error: ${e.error}`);
      setTimeout(() => setVoiceError(null), 4000);
    };

    recognition.onend = () => setListening(false);

    try {
      recognition.start();
      window._surakshaRecognition = recognition;
      setListening(true);
      setVoiceError(null);
    } catch (err) {
      setVoiceError("Could not start voice input.");
    }
  };

  const d = batchResults ? batchResults[selectedBatch] : result;
  const allCats = d ? [...(d.rule_analysis?.categories || []), ...(d.psych_analysis?.categories || [])].filter((v, i, a) => a.indexOf(v) === i) : [];

  const riskConfig = {
    Low: { color: "#10B981", bg: "rgba(16,185,129,0.08)", label: "Low Risk" },
    Medium: { color: "#F59E0B", bg: "rgba(245,158,11,0.08)", label: "Medium Risk" },
    High: { color: "#F97316", bg: "rgba(249,115,22,0.08)", label: "High Risk" },
    Critical: { color: "#EF4444", bg: "rgba(239,68,68,0.08)", label: "Critical Risk" },
  };

  const PROFILES = [
    { id: "general", label: "General" },
    { id: "student", label: "Student" },
    { id: "elderly", label: "Elderly" },
    { id: "business_owner", label: "Business" },
  ];

  const TABS = ["overview", "highlights", "psychology", "urls", "actions"];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-sb-text tracking-tight">Fraud Analyzer</h1>
        <p className="text-sm text-sb-textSecondary mt-1">Paste a suspicious message for real-time risk assessment.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* LEFT PANEL */}
        <div className="lg:col-span-2 space-y-4">
          {/* Input */}
          <div className="bg-sb-card border border-sb-border rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-sb-textSecondary uppercase tracking-wider">Message</label>
              <label className="flex items-center gap-1.5 text-[11px] text-sb-textMuted cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isBatchMode}
                  onChange={(e) => setIsBatchMode(e.target.checked)}
                  className="rounded border-sb-border bg-sb-surface text-sb-accent focus:ring-sb-accent/50 h-3 w-3"
                />
                Batch mode
              </label>
            </div>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); handleSubmit(); } }}
              disabled={loading}
              rows={6}
              placeholder={isBatchMode ? "One message per line..." : "Paste suspicious SMS, WhatsApp, or call transcript..."}
              className="w-full bg-sb-surface border border-sb-border rounded-xl px-4 py-3 text-sm text-sb-text placeholder-sb-textMuted resize-none disabled:opacity-50 focus:border-sb-accent/50 transition-colors"
            />

            <div className="flex items-center gap-2">
              {/* Voice */}
              {voiceSupported ? (
                <button
                  onClick={handleVoice}
                  disabled={loading}
                  className={`px-3 py-2 rounded-xl text-xs font-medium transition-all btn-press ${
                    listening
                      ? "bg-risk-critical/10 text-risk-critical border border-risk-critical/20"
                      : "bg-sb-surface border border-sb-border text-sb-textSecondary hover:text-sb-text hover:border-sb-textMuted"
                  } disabled:opacity-50`}
                >
                  {listening ? (
                    <span className="flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="listening-pulse absolute inline-flex h-full w-full rounded-full bg-risk-critical" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-risk-critical" />
                      </span>
                      Listening...
                    </span>
                  ) : "Voice"}
                </button>
              ) : (
                <span className="text-[10px] text-sb-textMuted">Voice not supported</span>
              )}

              {/* Audio upload placeholder */}
              <span className="text-[10px] text-sb-textMuted border border-sb-border rounded-xl px-3 py-2">
                Audio transcription (Coming Soon)
              </span>
            </div>
            {voiceError && <p className="text-[10px] text-risk-critical">{voiceError}</p>}

            {/* Profile */}
            <div>
              <label className="text-[10px] font-medium text-sb-textMuted uppercase tracking-wider block mb-2">Profile</label>
              <div className="grid grid-cols-4 gap-1.5">
                {PROFILES.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setProfile(p.id)}
                    className={`py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                      profile === p.id
                        ? "bg-sb-accent/10 text-sb-accent border border-sb-accent/20"
                        : "bg-sb-surface border border-sb-border text-sb-textMuted hover:text-sb-textSecondary"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* AI toggle */}
            <div className="flex items-center justify-between bg-sb-surface border border-sb-border rounded-xl px-3 py-2.5">
              <div>
                <p className="text-xs font-medium text-sb-text">AI Analysis</p>
                <p className="text-[10px] text-sb-textMuted">BART semantic detection</p>
              </div>
              <button
                onClick={() => setAiEnabled(!aiEnabled)}
                className={`relative w-10 h-5 rounded-full transition-colors ${aiEnabled ? "bg-sb-accent" : "bg-sb-border"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${aiEnabled ? "translate-x-5" : ""}`} />
              </button>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!message.trim() || loading}
              className="w-full py-3 bg-sb-accent hover:bg-sb-accentHover disabled:bg-sb-border disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all btn-press"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Analyzing...
                </span>
              ) : isBatchMode ? "Analyze Batch" : "Analyze Message"}
            </button>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="lg:col-span-3 space-y-4">
          {/* Loading skeleton */}
          {loading && (
            <div className="bg-sb-card border border-sb-border rounded-2xl p-8 space-y-4 animate-fade-in">
              <div className="skeleton h-6 w-32 rounded-lg" />
              <div className="skeleton h-32 w-32 rounded-full mx-auto" />
              <div className="skeleton h-4 w-48 rounded mx-auto" />
              <div className="skeleton h-4 w-64 rounded mx-auto" />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-risk-criticalBg border border-risk-critical/20 rounded-2xl p-5 animate-fade-in">
              <p className="text-sm text-risk-critical">{error}</p>
              <button onClick={() => setError(null)} className="text-xs text-risk-critical/70 underline mt-1">Dismiss</button>
            </div>
          )}

          {/* Batch selector */}
          {batchResults && batchResults.length > 0 && (
            <div className="bg-sb-card border border-sb-border rounded-2xl p-4 animate-fade-in">
              <p className="text-[10px] font-medium text-sb-textMuted uppercase tracking-wider mb-2">
                {batchResults.length} Results
              </p>
              <div className="flex flex-wrap gap-1.5">
                {batchResults.map((r, i) => {
                  const lvl = r?.final_assessment?.risk_level || "Low";
                  const rc = riskConfig[lvl] || riskConfig.Low;
                  return (
                    <button
                      key={i}
                      onClick={() => { setSelectedBatch(i); setActiveTab("overview"); }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                        selectedBatch === i ? "ring-1 ring-sb-accent" : ""
                      }`}
                      style={{ backgroundColor: rc.bg, color: rc.color }}
                    >
                      #{i + 1} {r?.error ? "Error" : `${lvl} (${r?.final_assessment?.final_score})`}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* RESULT */}
          {d && !d.error && !loading && (
            <div className="animate-slide-up space-y-4">
              {/* Risk gauge card */}
              <div className="bg-sb-card border border-sb-border rounded-2xl p-8">
                <div className="flex flex-col items-center">
                  {/* SVG Gauge */}
                  <div className="relative w-40 h-40 mb-4">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="#1F2937" strokeWidth="6" />
                      <circle
                        cx="50" cy="50" r="42" fill="none"
                        stroke={riskConfig[d.final_assessment.risk_level]?.color || "#10B981"}
                        strokeWidth="6" strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 42}
                        strokeDashoffset={2 * Math.PI * 42 * (1 - d.final_assessment.final_score / 100)}
                        className="animate-gauge-fill"
                        style={{ transition: "stroke-dashoffset 1.5s ease-out" }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-black text-sb-text">{d.final_assessment.final_score}</span>
                      <span className="text-[10px] text-sb-textMuted">/100</span>
                    </div>
                  </div>

                  {/* Badge */}
                  <span
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold ${d.final_assessment.risk_level === "Critical" ? "critical-pulse" : ""}`}
                    style={{
                      backgroundColor: riskConfig[d.final_assessment.risk_level]?.bg,
                      color: riskConfig[d.final_assessment.risk_level]?.color,
                    }}
                  >
                    {riskConfig[d.final_assessment.risk_level]?.label || d.final_assessment.risk_level}
                  </span>

                  {/* Agreement */}
                  <div className="flex items-center gap-3 mt-4">
                    <span className="text-[10px] text-sb-textMuted">Agreement: {d.final_assessment.agreement_level}</span>
                    {d.final_assessment.agreement_type && (
                      <span className="text-[10px] text-sb-textMuted font-mono">{d.final_assessment.agreement_type}</span>
                    )}
                  </div>

                  {/* Rule vs AI bars */}
                  <div className="w-full max-w-xs mt-6 space-y-2">
                    <BarRow label="Rule Engine" value={d.rule_analysis.score} color="#3B82F6" />
                    <BarRow label="AI Model" value={d.ai_analysis.enabled ? Math.round(d.ai_analysis.probability * 100) : 0} color="#8B5CF6" disabled={!d.ai_analysis.enabled} />
                    <BarRow label="Psychology" value={d.psych_analysis.score} color="#EC4899" />
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="bg-sb-card border border-sb-border rounded-2xl overflow-hidden">
                <div className="flex border-b border-sb-border overflow-x-auto">
                  {TABS.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-3 text-xs font-medium capitalize whitespace-nowrap transition-all ${
                        activeTab === tab
                          ? "tab-active bg-sb-surface"
                          : "text-sb-textMuted hover:text-sb-textSecondary"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="p-5 animate-fade-in" key={activeTab}>
                  {activeTab === "overview" && <OverviewTab d={d} allCats={allCats} riskConfig={riskConfig} />}
                  {activeTab === "highlights" && <HighlightsTab d={d} />}
                  {activeTab === "psychology" && <PsychologyTab d={d} />}
                  {activeTab === "urls" && <UrlsTab d={d} />}
                  {activeTab === "actions" && <ActionsTab d={d} />}
                </div>
              </div>
            </div>
          )}

          {/* Batch error */}
          {d && d.error && !loading && (
            <div className="bg-risk-criticalBg border border-risk-critical/20 rounded-2xl p-5 animate-fade-in">
              <p className="text-sm text-risk-critical font-medium">Analysis failed</p>
              <p className="text-xs text-sb-textMuted mt-1">{d.error}</p>
            </div>
          )}

          {/* Empty state */}
          {!d && !loading && !error && (
            <div className="bg-sb-card border border-sb-border rounded-2xl p-12 text-center animate-fade-in">
              <div className="w-16 h-16 bg-sb-surface rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <p className="text-sm text-sb-textSecondary">Paste a message and click Analyze to begin.</p>
              <p className="text-[10px] text-sb-textMuted mt-1">Results will appear here with full breakdown.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ========== Sub-components ========== */

function BarRow({ label, value, color, disabled }) {
  return (
    <div>
      <div className="flex justify-between text-[10px] text-sb-textMuted mb-0.5">
        <span>{label} {disabled ? "(off)" : ""}</span>
        <span className="font-mono">{disabled ? "—" : value}</span>
      </div>
      <div className="w-full h-1.5 bg-sb-surface rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: disabled ? "0%" : `${value}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function OverviewTab({ d, allCats, riskConfig }) {
  return (
    <div className="space-y-4">
      {/* Flags */}
      <div className="flex flex-wrap gap-1.5">
        <Flag label="OTP" active={d.rule_analysis.flags.has_otp} />
        <Flag label="Suspicious URL" active={d.rule_analysis.flags.has_suspicious_url} />
        <Flag label="Money Request" active={d.rule_analysis.flags.has_money_request} />
        {d.rule_analysis.flags.has_financial_request !== undefined && <Flag label="Financial" active={d.rule_analysis.flags.has_financial_request} />}
        {d.rule_analysis.flags.has_dynamic_urgency !== undefined && <Flag label="Time Pressure" active={d.rule_analysis.flags.has_dynamic_urgency} />}
      </div>

      {/* Categories */}
      {allCats.length > 0 && (
        <div>
          <p className="text-[10px] font-medium text-sb-textMuted uppercase tracking-wider mb-2">Detected Categories</p>
          <div className="flex flex-wrap gap-1.5">
            {allCats.map((cat) => (
              <span key={cat} className="px-2.5 py-1 bg-sb-surface border border-sb-border rounded-lg text-[11px] text-sb-textSecondary">
                {cat.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Score detail */}
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <span className="text-sb-textMuted">Rule (adj / orig)</span>
        <span className="text-sb-text font-mono text-right">{d.rule_analysis.score} / {d.rule_analysis.original_score}</span>
        <span className="text-sb-textMuted">Psych (adj / orig)</span>
        <span className="text-sb-text font-mono text-right">{d.psych_analysis.score} / {d.psych_analysis.original_score}</span>
        <span className="text-sb-textMuted">AI Probability</span>
        <span className="text-sb-text font-mono text-right">{(d.ai_analysis.probability * 100).toFixed(1)}%</span>
        <span className="text-sb-textMuted">Profile</span>
        <span className="text-sb-text font-mono text-right capitalize">{d.profile_adjustment.profile_used}</span>
      </div>
    </div>
  );
}

function HighlightsTab({ d }) {
  const text = d.message;
  const highlights = d.highlights || [];

  if (highlights.length === 0) {
    return <p className="text-sm text-sb-textMuted">No suspicious phrases detected.</p>;
  }

  const sorted = [...highlights].sort((a, b) => a.start - b.start);
  const merged = [];
  for (const h of sorted) {
    if (merged.length === 0 || h.start >= merged[merged.length - 1].end) merged.push(h);
  }

  const segments = [];
  let cursor = 0;
  for (const h of merged) {
    if (h.start > cursor) segments.push({ type: "plain", text: text.slice(cursor, h.start) });
    segments.push({ type: "hl", text: text.slice(h.start, h.end), color: h.color, category: h.category });
    cursor = h.end;
  }
  if (cursor < text.length) segments.push({ type: "plain", text: text.slice(cursor) });

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed whitespace-pre-wrap">
        {segments.map((s, i) =>
          s.type === "plain" ? (
            <span key={i} className="text-sb-textSecondary">{s.text}</span>
          ) : (
            <span key={i} title={s.category} className="font-medium rounded px-0.5 cursor-help" style={{ backgroundColor: `${s.color}20`, color: s.color }}>
              {s.text}
            </span>
          )
        )}
      </p>
      <div className="flex flex-wrap gap-1.5 pt-3 border-t border-sb-border">
        {[...new Set(merged.map(h => h.category))].map(cat => {
          const color = merged.find(h => h.category === cat)?.color;
          return <span key={cat} className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: `${color}15`, color }}>{cat.replace(/_/g, " ")}</span>;
        })}
      </div>
    </div>
  );
}

function PsychologyTab({ d }) {
  const cats = d.psych_analysis.categories;
  return (
    <div className="space-y-3">
      {cats.length > 0 ? (
        <>
          <div className="flex flex-wrap gap-1.5">
            {cats.map(c => (
              <span key={c} className="px-3 py-1.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg text-xs font-medium">{c}</span>
            ))}
          </div>
          <p className="text-xs text-sb-textSecondary leading-relaxed">{d.psych_analysis.explanation}</p>
          <div className="text-[10px] text-sb-textMuted font-mono">Psych Score: {d.psych_analysis.score}/100</div>
        </>
      ) : (
        <p className="text-sm text-sb-textMuted">No psychological manipulation detected.</p>
      )}
    </div>
  );
}

function UrlsTab({ d }) {
  const urls = d.rule_analysis.url_analysis;
  return (
    <div className="space-y-3">
      {urls.suspicious_urls.length > 0 ? (
        <>
          {urls.suspicious_urls.map((url, i) => (
            <div key={i} className="bg-risk-criticalBg border border-risk-critical/10 rounded-xl px-3 py-2">
              <span className="text-xs text-risk-critical font-mono break-all">{url}</span>
            </div>
          ))}
          {urls.reasons.map((r, i) => (
            <p key={i} className="text-xs text-sb-textMuted">— {r}</p>
          ))}
          <p className="text-[10px] text-sb-textMuted font-mono">URL Score: {urls.url_score}</p>
        </>
      ) : (
        <p className="text-sm text-sb-textMuted">No suspicious URLs detected.</p>
      )}
    </div>
  );
}

function ActionsTab({ d }) {
  const tips = d.safety_tips || [];
  return (
    <div className="space-y-4">
      {tips.length > 0 ? (
        <ul className="space-y-2">
          {tips.map((tip, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="flex-shrink-0 w-5 h-5 bg-sb-accent/10 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-[10px] font-bold text-sb-accent">{i + 1}</span>
              </span>
              <p className="text-xs text-sb-textSecondary leading-relaxed">{tip}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-sb-textMuted">No specific recommendations.</p>
      )}

      {/* Download */}
      <div className="pt-3 border-t border-sb-border">
        <DownloadButton analysisId={d.id} />
      </div>
    </div>
  );
}

function DownloadButton({ analysisId }) {
  const [dl, setDl] = useState(false);
  const [err, setErr] = useState(null);

  const handle = async () => {
    if (!analysisId) return;
    setDl(true); setErr(null);
    try {
      const { downloadReport } = await import("@/lib/api");
      const blob = await downloadReport(analysisId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `suraksha_report_${analysisId}.pdf`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); window.URL.revokeObjectURL(url);
    } catch (e) { setErr(e.message); }
    finally { setDl(false); }
  };

  return (
    <div>
      <button onClick={handle} disabled={dl || !analysisId} className="px-4 py-2 bg-sb-surface border border-sb-border rounded-xl text-xs font-medium text-sb-textSecondary hover:text-sb-text hover:border-sb-textMuted transition-all btn-press disabled:opacity-50">
        {dl ? "Generating..." : "Download PDF Report"}
      </button>
      {err && <p className="text-[10px] text-risk-critical mt-1">{err}</p>}
    </div>
  );
}

function Flag({ label, active }) {
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${active ? "bg-risk-critical/10 text-risk-critical" : "bg-sb-surface text-sb-textMuted"}`}>
      {label}: {active ? "Yes" : "No"}
    </span>
  );
}