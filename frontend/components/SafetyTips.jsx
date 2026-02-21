"use client";

/**
 * SafetyTips
 * -----------
 * Renders contextual safety advice based on detected scam categories.
 *
 * Props:
 *   tips: string[]
 */
export default function SafetyTips({ tips }) {
  if (!tips || tips.length === 0) return null;

  return (
    <div className="bg-suraksha-card border border-suraksha-border rounded-xl p-5">
      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
        <span>💡</span>
        Safety Recommendations
      </h3>

      <ul className="space-y-3">
        {tips.map((tip, i) => (
          <li key={i} className="flex items-start gap-3">
            {/* Numbered circle */}
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-suraksha-accent/15 text-suraksha-accent text-xs font-bold flex items-center justify-center mt-0.5">
              {i + 1}
            </span>
            <p className="text-sm text-gray-300 leading-relaxed">{tip}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}