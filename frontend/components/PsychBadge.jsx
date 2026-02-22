"use client";

export default function PsychBadge({ score, categories, explanation }) {
  if (!categories || categories.length === 0) return null;

  return (
    <div className="bg-sb-card border border-sb-border rounded-2xl p-5 space-y-3">
      <h3 className="text-xs font-semibold text-sb-textSecondary uppercase tracking-wider">
        Psychological Analysis
      </h3>
      <div className="flex flex-wrap gap-1.5">
        {categories.map((cat) => (
          <span
            key={cat}
            className="px-3 py-1.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-xl text-xs font-medium"
          >
            {cat}
          </span>
        ))}
      </div>
      {explanation && (
        <p className="text-xs text-sb-textSecondary leading-relaxed">
          {explanation}
        </p>
      )}
      <p className="text-[10px] text-sb-textMuted font-mono">
        Psych Score: {score}/100
      </p>
    </div>
  );
}