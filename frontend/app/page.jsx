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

/**
 * Main Analyzer Page
 * -------------------
 * Single-page interface for analysing suspicious messages.
 * Supports single and batch analysis, voice input, profile selection,
 * and full result visualisation.
 *
 * Sample test messages (for quick testing):
 *
 * English scam:
 *   "Dear customer, your SBI account has been blocked due to KYC expiry.
 *    Click http://sbi-kyc-update.in to verify immediately or account will
 *    be permanently closed within 24 hours."
 *
 * Hindi scam:
 *   "Aapka PAN card link nahi hai. Turant yeh link kholein:
 *    http://pan-update.co.in ya aapka account band ho jayega."
 *
 * Legitimate:
 *   "Your Amazon order #402-1234567 has been shipped. Track at
 *    amazon.in/trackpackage"
 *
 * Borderline:
 *   "Congratulations! You've been selected for a customer feedback survey.
 *    Complete it to receive 500 reward points."
 */
export default function AnalyzerPage() {
  // ---- Form state ----------------------------------------------------------
  const [message, setMessage] = useState("");
  const [profile, setProfile] = useState("general");
  const [aiEnabled, setAiEnabled] = useState(true);

  // ---- Analysis state ------------------------------------------------------
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [batchResults, setBatchResults] = useState(null);
  const [selectedBatchIndex, setSelectedBatchIndex] = useState(0);

  // ---- Voice input handler -------------------------------------------------
  const handleTranscript = useCallback((transcript) => {
    setMessage((prev) => {
      const separator = prev.trim() ? " " : "";
      return prev + separator + transcript;
    });
  }, []);

  // ---- Submit handler ------------------------------------------------------
  const handleSubmit = async (text) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setBatchResults(null);
    setSelectedBatchIndex(0);

    try {
      // Determine if batch (multiple non-empty lines)
      const lines = text.split("\n").filter((l) => l.trim());
      const isBatch = lines.length > 1;

      if (isBatch) {
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

  // ---- Determine which result to display -----------------------------------
  const displayResult = batchResults
    ? batchResults[selectedBatchIndex]
    : result;

  // ---- Risk color helper for batch tabs ------------------------------------
  const riskColorClass = (level) => {
    const map = {
      Low: "bg-green-500/15 text-green-400 border-green-500/40",
      Medium: "bg-yellow-500/15 text-yellow-400 border-yellow-500/40",
      High: "bg-orange-500/15 text-orange-400 border-orange-500/40",
      Critical: "bg-red-500/15 text-red-400 border-red-500/40",
    };
    return map[level] || "bg-gray-500/15 text-gray-400 border-gray-500/40";
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* ================================================================
          HEADER
          ================================================================ */}
      <section className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          Fraud Intelligence Analyzer
        </h1>
        <p className="text-sm text-gray-400 max-w-xl mx-auto">
          Paste a suspicious SMS, WhatsApp message, or call transcript below.
          SurakshaAI combines rule-based detection, AI semantic analysis, and
          psychological profiling to assess fraud risk.
        </p>
      </section>

      {/* ================================================================
          INPUT SECTION
          ================================================================ */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column – message input */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <MessageInput
                value={message}
                onChange={setMessage}
                onSubmit={handleSubmit}
                disabled={loading}
              />
            </div>
            <VoiceInputButton
              onTranscript={handleTranscript}
              disabled={loading}
            />
          </div>
        </div>

        {/* Right column – profile & AI toggle */}
        <div>
          <ProfileSelector
            profile={profile}
            onSelect={setProfile}
            aiEnabled={aiEnabled}
            onAiToggle={setAiEnabled}
          />
        </div>
      </section>

      {/* ================================================================
          LOADING STATE
          ================================================================ */}
      {loading && <LoadingSpinner />}

      {/* ================================================================
          ERROR STATE
          ================================================================ */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 text-center">
          <p className="text-sm text-red-400 font-medium">⚠️ {error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-xs text-red-500 underline hover:text-red-300"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ================================================================
          BATCH SELECTOR (if batch results exist)
          ================================================================ */}
      {batchResults && batchResults.length > 0 && (
        <section className="bg-suraksha-card border border-suraksha-border rounded-xl p-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Batch Results — {batchResults.length} messages analyzed
          </h3>
          <div className="flex flex-wrap gap-2">
            {batchResults.map((r, i) => {
              // Handle cases where a batch item may have errored
              const level = r?.final_assessment?.risk_level || "Unknown";
              const score = r?.final_assessment?.final_score ?? "?";
              const hasError = !!r?.error;

              return (
                <button
                  key={i}
                  onClick={() => setSelectedBatchIndex(i)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                    selectedBatchIndex === i
                      ? "ring-2 ring-suraksha-accent ring-offset-1 ring-offset-suraksha-dark"
                      : ""
                  } ${
                    hasError
                      ? "bg-red-900/20 text-red-400 border-red-500/30"
                      : riskColorClass(level)
                  }`}
                >
                  <span className="font-mono">#{i + 1}</span>
                  {hasError ? (
                    <span className="ml-1">Error</span>
                  ) : (
                    <span className="ml-1">
                      {level} ({score})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ================================================================
          RESULTS DISPLAY
          ================================================================ */}
      {displayResult && !displayResult.error && (
        <div className="space-y-6">
          {/* ---- Row 1: Risk Gauge + Confidence Meter + Export ----------- */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Risk Gauge */}
            <div className="bg-suraksha-card border border-suraksha-border rounded-xl p-6 flex items-center justify-center">
              <RiskGauge
                score={displayResult.final_assessment.final_score}
                riskLevel={displayResult.final_assessment.risk_level}
              />
            </div>

            {/* Confidence Meter */}
            <div className="md:col-span-2">
              <ConfidenceMeter
                ruleScore={displayResult.rule_analysis.score}
                aiProbability={displayResult.ai_analysis.probability}
                aiEnabled={displayResult.ai_analysis.enabled}
                agreementLevel={displayResult.final_assessment.agreement_level}
              />
            </div>
          </section>

          {/* ---- Row 2: Highlighted Text -------------------------------- */}
          <section>
            <HighlightedText
              text={displayResult.message}
              highlights={displayResult.highlights}
            />
          </section>

          {/* ---- Row 3: Psych Badges + URL Analysis --------------------- */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Psychological tactics */}
            <PsychBadge
              score={displayResult.psych_analysis.score}
              categories={displayResult.psych_analysis.categories}
              explanation={displayResult.psych_analysis.explanation}
            />

            {/* URL Analysis */}
            <div className="bg-suraksha-card border border-suraksha-border rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                URL Analysis
              </h3>

              {displayResult.rule_analysis.url_analysis.suspicious_urls.length >
              0 ? (
                <div className="space-y-2">
                  {/* Suspicious URLs list */}
                  {displayResult.rule_analysis.url_analysis.suspicious_urls.map(
                    (url, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
                      >
                        <span className="text-red-400 text-sm">🔗</span>
                        <span className="text-xs text-red-300 font-mono break-all">
                          {url}
                        </span>
                      </div>
                    )
                  )}

                  {/* Reasons */}
                  <div className="pt-2 border-t border-suraksha-border">
                    {displayResult.rule_analysis.url_analysis.reasons.map(
                      (reason, i) => (
                        <p key={i} className="text-xs text-gray-400 leading-relaxed">
                          • {reason}
                        </p>
                      )
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">
                  No suspicious URLs detected.
                </p>
              )}

              {/* Flags */}
              <div className="flex items-center gap-3 pt-2 border-t border-suraksha-border">
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    displayResult.rule_analysis.flags.has_otp
                      ? "bg-red-500/15 text-red-400"
                      : "bg-gray-800 text-gray-600"
                  }`}
                >
                  OTP: {displayResult.rule_analysis.flags.has_otp ? "⚠️ Detected" : "None"}
                </span>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    displayResult.rule_analysis.flags.has_suspicious_url
                      ? "bg-red-500/15 text-red-400"
                      : "bg-gray-800 text-gray-600"
                  }`}
                >
                  URL: {displayResult.rule_analysis.flags.has_suspicious_url ? "⚠️ Suspicious" : "Clean"}
                </span>
              </div>
            </div>
          </section>

          {/* ---- Row 4: Safety Tips ------------------------------------- */}
          <section>
            <SafetyTips tips={displayResult.safety_tips} />
          </section>

          {/* ---- Row 5: Profile info + Export ---------------------------- */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Profile adjustment info */}
            <div className="bg-suraksha-card border border-suraksha-border rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                Profile Adjustment
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Profile used:</span>
                <span className="text-xs font-semibold text-suraksha-accent capitalize">
                  {displayResult.profile_adjustment.profile_used}
                </span>
              </div>
              {Object.keys(displayResult.profile_adjustment.multipliers_applied)
                .length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Multipliers applied:</p>
                  {Object.entries(
                    displayResult.profile_adjustment.multipliers_applied
                  ).map(([cat, mult]) => (
                    <div
                      key={cat}
                      className="flex justify-between text-xs bg-gray-800/50 rounded px-2 py-1"
                    >
                      <span className="text-gray-400">{cat}</span>
                      <span className="text-yellow-400 font-mono">
                        ×{mult}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Score detail */}
              <div className="pt-2 border-t border-suraksha-border space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Rule Score (adjusted)</span>
                  <span className="text-gray-300 font-mono">
                    {displayResult.rule_analysis.score}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Rule Score (original)</span>
                  <span className="text-gray-300 font-mono">
                    {displayResult.rule_analysis.original_score}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Psych Score (adjusted)</span>
                  <span className="text-gray-300 font-mono">
                    {displayResult.psych_analysis.score}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Psych Score (original)</span>
                  <span className="text-gray-300 font-mono">
                    {displayResult.psych_analysis.original_score}
                  </span>
                </div>
              </div>
            </div>

            {/* Export */}
            <div className="bg-suraksha-card border border-suraksha-border rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                Export &amp; Share
              </h3>
              <p className="text-xs text-gray-500">
                Download a comprehensive PDF report containing the full
                analysis, scores, and safety recommendations.
              </p>
              <ShareExport analysisId={displayResult.id} />

              {/* AI label */}
              {displayResult.ai_analysis.enabled && (
                <div className="pt-3 border-t border-suraksha-border">
                  <p className="text-xs text-gray-500">AI Classification</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-semibold ${
                        displayResult.ai_analysis.label === "fraud"
                          ? "bg-red-500/15 text-red-400"
                          : displayResult.ai_analysis.label === "suspicious"
                          ? "bg-yellow-500/15 text-yellow-400"
                          : "bg-green-500/15 text-green-400"
                      }`}
                    >
                      {displayResult.ai_analysis.label}
                    </span>
                    <span className="text-[10px] text-gray-600 font-mono">
                      conf: {(displayResult.ai_analysis.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {/* ---- Batch item error display ----------------------------------- */}
      {displayResult && displayResult.error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5">
          <p className="text-sm text-red-400 font-medium">
            ⚠️ Analysis failed for this message
          </p>
          <p className="text-xs text-red-300 mt-1">{displayResult.error}</p>
          <p className="text-xs text-gray-500 mt-2 break-all">
            Message: {displayResult.message}
          </p>
        </div>
      )}

      {/* ================================================================
          SCAM SIMULATOR (always visible)
          ================================================================ */}
      <section className="pt-4">
        <ScamSimulator />
      </section>
    </div>
  );
}