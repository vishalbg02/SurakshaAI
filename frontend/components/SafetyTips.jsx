"use client";

export default function SafetyTips({ tips }) {
  if (!tips || tips.length === 0) return null;

  return (
    <div className="bg-sb-card border border-sb-border rounded-2xl p-5 space-y-3">
      <h3 className="text-xs font-semibold text-sb-textSecondary uppercase tracking-wider">
        Safety Recommendations
      </h3>
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
    </div>
  );
}