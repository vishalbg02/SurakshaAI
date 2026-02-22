"use client";

/**
 * ConfidenceMeter
 * Simplified score comparison for the Advanced Analysis section.
 * Clean bars, no flashiness.
 */
export default function ConfidenceMeter({
  ruleScore,
  aiProbability,
  aiEnabled,
  agreementLevel,
}) {
  const aiScaled = Math.round(aiProbability * 100);

  return (
    <div className="bg-white border border-gov-border rounded-lg p-5 space-y-4">
      <h3 className="text-xs font-semibold text-gov-text uppercase tracking-wider">
        Score Comparison
      </h3>

      {/* Rule bar */}
      <div>
        <div className="flex justify-between text-xs text-gov-muted mb-1">
          <span>Rule Engine</span>
          <span className="font-mono">{ruleScore}/100</span>
        </div>
        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gov-navy rounded-full transition-all duration-700 ease-out"
            style={{ width: `${ruleScore}%` }}
          />
        </div>
      </div>

      {/* AI bar */}
      <div>
        <div className="flex justify-between text-xs text-gov-muted mb-1">
          <span>AI Model {!aiEnabled && "(disabled)"}</span>
          <span className="font-mono">{aiEnabled ? `${aiScaled}/100` : "—"}</span>
        </div>
        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${
              aiEnabled ? "bg-gov-accent" : "bg-gray-200"
            }`}
            style={{ width: aiEnabled ? `${aiScaled}%` : "0%" }}
          />
        </div>
      </div>

      {/* Agreement */}
      <div className="flex items-center justify-between pt-3 border-t border-gov-border">
        <span className="text-xs text-gov-muted">Agreement</span>
        <span
          className={`px-3 py-1 text-xs font-medium rounded ${
            agreementLevel === "HIGH"
              ? "bg-risk-low/10 text-risk-low"
              : "bg-risk-medium/10 text-risk-medium"
          }`}
        >
          {agreementLevel}
        </span>
      </div>
    </div>
  );
}