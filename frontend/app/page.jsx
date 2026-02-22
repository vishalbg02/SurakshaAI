"use client";

import { useState, useCallback } from "react";
import { analyzeMessage, analyzeBatch } from "@/lib/api";

import MessageInput from "@/components/MessageInput";
import VoiceInputButton from "@/components/VoiceInputButton";
import ProfileSelector from "@/components/ProfileSelector";
import RiskGauge from "@/components/RiskGauge";
import ConfidenceMeter from "@/components/ConfidenceMeter";
import HighlightedText from "@/components/HighlightedText";
import PsychBadge from "@/components/PsychBadge";
import SafetyTips from "@/components/SafetyTips";
import ShareExport from "@/components/ShareExport";
import ScamSimulator from "@/components/ScamSimulator";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function AnalyzerPage() {
  const [message, setMessage] = useState("");
  const [profile, setProfile] = useState("general");
  const [aiEnabled, setAiEnabled] = useState(true);
  const [isBatchMode, setIsBatchMode] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [batchResults, setBatchResults] = useState(null);
  const [selectedBatchIndex, setSelectedBatchIndex] = useState(0);

  // Collapsible states
  const [showMessageBreakdown, setShowMessageBreakdown] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleTranscript = useCallback((transcript) => {
    setMessage((prev) => {
      const separator = prev.trim() ? " " : "";
      return prev + separator + transcript;
    });
  }, []);

  const handleSubmit = async (text) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setBatchResults(null);
    setSelectedBatchIndex(0);

    try {
      // BATCH FIX: Only use batch if toggle is explicitly ON.
      // Never auto-detect based on newlines.
      if (isBatchMode) {
        const response = await analyzeBatch(text, profile, aiEnabled);
        setBatchResults(response.results);
      } else {
        const response = await analyzeMessage(text, profile, aiEnabled);
        setResult(response.data);
      }
    } catch (err) {
      console.error("Analysis error:", err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const displayResult = batchResults
    ? batchResults[selectedBatchIndex]
    : result;

  const allCategories = displayResult
    ? [
        ...(displayResult.rule_analysis?.categories || []),
        ...(displayResult.psych_analysis?.categories || []),
      ].filter((v, i, a) => a.indexOf(v) === i)
    : [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <section>
        <h1 className="text-2xl font-bold text-gov-navy">
          Analyze Suspicious Communication
        </h1>
        <p className="text-sm text-gov-muted mt-1 max-w-2xl">
          Paste a suspicious SMS, WhatsApp message, or call transcript below.
          The system uses rule-based detection, AI semantic analysis, and
          psychological profiling to assess fraud risk.
        </p>
      </section>

      {/* Input Section */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <MessageInput
                value={message}
                onChange={setMessage}
                onSubmit={handleSubmit}
                disabled={loading}
                isBatchMode={isBatchMode}
                onBatchToggle={setIsBatchMode}
              />
            </div>
          </div>
          <VoiceInputButton onTranscript={handleTranscript} disabled={loading} />
        </div>

        <div>
          <ProfileSelector
            profile={profile}
            onSelect={setProfile}
            aiEnabled={aiEnabled}
            onAiToggle={setAiEnabled}
          />
        </div>
      </section>

      {/* Loading */}
      {loading && <LoadingSpinner message="Analyzing message..." />}

      {/* Error */}
      {error && (
        <div className="bg-white border border-risk-critical/30 rounded-lg p-5">
          <p className="text-sm text-risk-critical font-medium">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-xs text-risk-critical underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Batch selector */}
      {batchResults && batchResults.length > 0 && (
        <section className="bg-white border border-gov-border rounded-lg p-4">
          <p className="text-xs font-semibold text-gov-text uppercase tracking-wider mb-3">
            Batch Results — {batchResults.length} messages
          </p>
          <div className="flex flex-wrap gap-2">
            {batchResults.map((r, i) => {
              const level = r?.final_assessment?.risk_level || "Unknown";
              const score = r?.final_assessment?.final_score ?? "?";
              const hasError = !!r?.error;
              const riskBorder = {
                Low: "border-risk-low",
                Medium: "border-risk-medium",
                High: "border-risk-high",
                Critical: "border-risk-critical",
              };

              return (
                <button
                  key={i}
                  onClick={() => setSelectedBatchIndex(i)}
                  className={`px-3 py-2 rounded text-xs font-medium border transition-all ${
                    selectedBatchIndex === i ? "ring-2 ring-gov-accent ring-offset-1" : ""
                  } ${
                    hasError
                      ? "border-risk-critical/30 text-risk-critical bg-risk-critical/5"
                      : `${riskBorder[level] || "border-gov-border"} bg-white text-gov-text`
                  }`}
                >
                  #{i + 1} {hasError ? "Error" : `${level} (${score})`}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* RESULTS */}
      {displayResult && !displayResult.error && (
        <div className="space-y-6">
          {/* 1. Risk-First Card */}
          <RiskGauge
            score={displayResult.final_assessment.final_score}
            riskLevel={displayResult.final_assessment.risk_level}
            categories={allCategories}
          />

          {/* 2. Safety Recommendations */}
          {displayResult.safety_tips?.length > 0 && (
            <div className="bg-white border border-gov-border rounded-lg p-5">
              <h3 className="text-xs font-semibold text-gov-text uppercase tracking-wider mb-4">
                Safety Recommendations
              </h3>
              <ul className="space-y-2">
                {displayResult.safety_tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gov-navy/10 text-gov-navy text-[10px] font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-sm text-gov-text leading-relaxed">{tip}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 3. Message Breakdown (Collapsible) */}
          <div className="bg-white border border-gov-border rounded-lg">
            <button
              onClick={() => setShowMessageBreakdown(!showMessageBreakdown)}
              className="w-full px-5 py-4 flex items-center justify-between text-left"
            >
              <h3 className="text-xs font-semibold text-gov-text uppercase tracking-wider">
                Message Breakdown
              </h3>
              <span className="text-gov-muted text-xs">
                {showMessageBreakdown ? "Collapse" : "Expand"}
              </span>
            </button>
            {showMessageBreakdown && (
              <div className="px-5 pb-5 space-y-4">
                <HighlightedText
                  text={displayResult.message}
                  highlights={displayResult.highlights}
                />
                {/* Psych categories */}
                {displayResult.psych_analysis.categories.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gov-text uppercase tracking-wider">
                      Psychological Tactics Detected
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {displayResult.psych_analysis.categories.map((cat) => (
                        <span
                          key={cat}
                          className="text-xs font-medium px-3 py-1 rounded bg-gov-navy/5 text-gov-navy border border-gov-navy/10"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gov-muted leading-relaxed">
                      {displayResult.psych_analysis.explanation}
                    </p>
                  </div>
                )}
                {/* URL Analysis */}
                {displayResult.rule_analysis.url_analysis.suspicious_urls.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gov-text uppercase tracking-wider">
                      Suspicious URLs
                    </p>
                    {displayResult.rule_analysis.url_analysis.suspicious_urls.map((url, i) => (
                      <div
                        key={i}
                        className="bg-risk-critical/5 border border-risk-critical/10 rounded px-3 py-2"
                      >
                        <span className="text-xs text-risk-critical font-mono break-all">
                          {url}
                        </span>
                      </div>
                    ))}
                    {displayResult.rule_analysis.url_analysis.reasons.map((reason, i) => (
                      <p key={i} className="text-xs text-gov-muted">
                        — {reason}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 4. Advanced Technical Details (Collapsible) */}
          <div className="bg-white border border-gov-border rounded-lg">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full px-5 py-4 flex items-center justify-between text-left"
            >
              <h3 className="text-xs font-semibold text-gov-text uppercase tracking-wider">
                Advanced Analysis
              </h3>
              <span className="text-gov-muted text-xs">
                {showAdvanced ? "Collapse" : "Expand"}
              </span>
            </button>
            {showAdvanced && (
              <div className="px-5 pb-5 space-y-4">
                {/* Confidence meter */}
                <ConfidenceMeter
                  ruleScore={displayResult.rule_analysis.score}
                  aiProbability={displayResult.ai_analysis.probability}
                  aiEnabled={displayResult.ai_analysis.enabled}
                  agreementLevel={displayResult.final_assessment.agreement_level}
                />

                {/* Score details table */}
                <div className="bg-gray-50 border border-gov-border rounded-lg p-4">
                  <p className="text-xs font-semibold text-gov-text uppercase tracking-wider mb-3">
                    Score Details
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <DetailRow label="Rule Score (adjusted)" value={displayResult.rule_analysis.score} />
                    <DetailRow label="Rule Score (original)" value={displayResult.rule_analysis.original_score} />
                    <DetailRow label="Psych Score (adjusted)" value={displayResult.psych_analysis.score} />
                    <DetailRow label="Psych Score (original)" value={displayResult.psych_analysis.original_score} />
                    <DetailRow label="AI Probability" value={`${(displayResult.ai_analysis.probability * 100).toFixed(1)}%`} />
                    <DetailRow label="AI Confidence" value={`${(displayResult.ai_analysis.confidence * 100).toFixed(1)}%`} />
                    <DetailRow label="AI Label" value={displayResult.ai_analysis.label} />
                    <DetailRow label="Profile Used" value={displayResult.profile_adjustment.profile_used} />
                  </div>

                  {/* Flags */}
                  <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gov-border">
                    <FlagBadge label="OTP" active={displayResult.rule_analysis.flags.has_otp} />
                    <FlagBadge label="Suspicious URL" active={displayResult.rule_analysis.flags.has_suspicious_url} />
                    <FlagBadge label="Money Request" active={displayResult.rule_analysis.flags.has_money_request} />
                    {displayResult.rule_analysis.flags.has_financial_request !== undefined && (
                      <FlagBadge label="Financial Request" active={displayResult.rule_analysis.flags.has_financial_request} />
                    )}
                    {displayResult.rule_analysis.flags.has_dynamic_urgency !== undefined && (
                      <FlagBadge label="Dynamic Urgency" active={displayResult.rule_analysis.flags.has_dynamic_urgency} />
                    )}
                  </div>
                </div>

                {/* Export */}
                <div className="flex items-center justify-between pt-2">
                  <ShareExport analysisId={displayResult.id} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Batch error */}
      {displayResult && displayResult.error && (
        <div className="bg-white border border-risk-critical/20 rounded-lg p-5">
          <p className="text-sm text-risk-critical font-medium">
            Analysis failed for this message
          </p>
          <p className="text-xs text-gov-muted mt-1">{displayResult.error}</p>
        </div>
      )}

      {/* Scam Simulator */}
      <ScamSimulator />
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <>
      <span className="text-gov-muted">{label}</span>
      <span className="text-gov-text font-mono text-right">{value}</span>
    </>
  );
}

function FlagBadge({ label, active }) {
  return (
    <span
      className={`text-[10px] px-2 py-0.5 rounded font-medium ${
        active
          ? "bg-risk-critical/10 text-risk-critical"
          : "bg-gray-100 text-gray-400"
      }`}
    >
      {label}: {active ? "Detected" : "None"}
    </span>
  );
}