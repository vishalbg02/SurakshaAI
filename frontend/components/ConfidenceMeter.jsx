"use client";

/**
 * ConfidenceMeter
 * ----------------
 * Visually compares rule-based vs AI scores and displays the
 * agreement level (HIGH or MODERATE).
 *
 * Props:
 *   ruleScore: number        – 0-100
 *   aiProbability: number    – 0-1
 *   aiEnabled: boolean
 *   agreementLevel: string   – "HIGH" | "MODERATE"
 */
export default function ConfidenceMeter({
  ruleScore,
  aiProbability,
  aiEnabled,
  agreementLevel,
}) {
  const aiScaled = Math.round(aiProbability * 100);

  const agreementColor =
    agreementLevel === "HIGH"
      ? "text-green-400 bg-green-400/10 border-green-400/30"
      : "text-yellow-400 bg-yellow-400/10 border-yellow-400/30";

  return (
    <div className="bg-suraksha-card border border-suraksha-border rounded-xl p-5 space-y-4">
      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
        Score Comparison
      </h3>

      {/* Rule-based bar */}
      <div>
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Rule Engine</span>
          <span className="font-mono">{ruleScore}/100</span>
        </div>
        <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${ruleScore}%` }}
          />
        </div>
      </div>

      {/* AI bar */}
      <div>
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>AI Model {!aiEnabled && "(disabled)"}</span>
          <span className="font-mono">
            {aiEnabled ? `${aiScaled}/100` : "—"}
          </span>
        </div>
        <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-out ${
              aiEnabled ? "bg-purple-500" : "bg-gray-700"
            }`}
            style={{ width: aiEnabled ? `${aiScaled}%` : "0%" }}
          />
        </div>
      </div>

      {/* Agreement badge */}
      <div className="flex items-center justify-between pt-2 border-t border-suraksha-border">
        <span className="text-xs text-gray-500">Agreement Level</span>
        <span
          className={`px-3 py-1 text-xs font-semibold rounded-full border ${agreementColor}`}
        >
          {agreementLevel}
        </span>
      </div>
    </div>
  );
}