"use client";

/**
 * RiskGauge
 * ----------
 * Circular SVG gauge that visually represents the final fraud score.
 * Color-coded by risk level:
 *   Green  → Low (0-30)
 *   Yellow → Medium (31-60)
 *   Orange → High (61-80)
 *   Red    → Critical (81-100)
 *
 * Props:
 *   score: number       – 0-100
 *   riskLevel: string   – "Low" | "Medium" | "High" | "Critical"
 */
export default function RiskGauge({ score, riskLevel }) {
  // SVG circle parameters
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(score, 0), 100);
  const offset = circumference - (progress / 100) * circumference;

  // Colour mapping
  const colorMap = {
    Low: { stroke: "#22C55E", bg: "rgba(34,197,94,0.1)", text: "text-green-400" },
    Medium: { stroke: "#EAB308", bg: "rgba(234,179,8,0.1)", text: "text-yellow-400" },
    High: { stroke: "#F97316", bg: "rgba(249,115,22,0.1)", text: "text-orange-400" },
    Critical: { stroke: "#EF4444", bg: "rgba(239,68,68,0.1)", text: "text-red-400" },
  };

  const colors = colorMap[riskLevel] || colorMap.Low;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-36 h-36">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="#334155"
            strokeWidth="8"
          />
          {/* Progress arc */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={colors.stroke}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="gauge-animate"
            style={{ transition: "stroke-dashoffset 1.2s ease-out" }}
          />
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-bold ${colors.text}`}>
            {score}
          </span>
          <span className="text-xs text-gray-500">/ 100</span>
        </div>
      </div>

      {/* Risk level badge */}
      <span
        className={`px-4 py-1.5 rounded-full text-sm font-semibold ${colors.text}`}
        style={{ backgroundColor: colors.bg }}
      >
        {riskLevel} Risk
      </span>
    </div>
  );
}