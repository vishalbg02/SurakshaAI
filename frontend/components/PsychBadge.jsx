"use client";

/**
 * PsychBadge
 * -----------
 * Displays psychological manipulation categories as colored tags
 * alongside the psych score and explanation.
 *
 * Props:
 *   score: number
 *   categories: string[]
 *   explanation: string
 */

const PSYCH_COLORS = {
  Fear: { bg: "bg-red-500/15", text: "text-red-400", border: "border-red-500/30" },
  Urgency: { bg: "bg-orange-500/15", text: "text-orange-400", border: "border-orange-500/30" },
  Authority: { bg: "bg-purple-500/15", text: "text-purple-400", border: "border-purple-500/30" },
  Reward: { bg: "bg-yellow-500/15", text: "text-yellow-400", border: "border-yellow-500/30" },
  Scarcity: { bg: "bg-cyan-500/15", text: "text-cyan-400", border: "border-cyan-500/30" },
};

const PSYCH_ICONS = {
  Fear: "😨",
  Urgency: "⏰",
  Authority: "👮",
  Reward: "🎁",
  Scarcity: "⚡",
};

export default function PsychBadge({ score, categories, explanation }) {
  const defaultStyle = {
    bg: "bg-gray-500/15",
    text: "text-gray-400",
    border: "border-gray-500/30",
  };

  return (
    <div className="bg-suraksha-card border border-suraksha-border rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
          Psychological Tactics
        </h3>
        <span className="text-xs font-mono text-gray-500">
          Score: {score}/100
        </span>
      </div>

      {/* Category badges */}
      {categories.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const style = PSYCH_COLORS[cat] || defaultStyle;
            const icon = PSYCH_ICONS[cat] || "🏷️";
            return (
              <span
                key={cat}
                className={`badge-hover inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${style.bg} ${style.text} ${style.border}`}
              >
                <span>{icon}</span>
                {cat}
              </span>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-gray-500 italic">
          No psychological manipulation tactics detected.
        </p>
      )}

      {/* Explanation */}
      {explanation && (
        <p className="text-xs text-gray-400 leading-relaxed border-t border-suraksha-border pt-3">
          {explanation}
        </p>
      )}
    </div>
  );
}