"use client";

/**
 * ProfileSelector
 * Updated for government trust style palette.
 */

const PROFILES = [
  {
    id: "general",
    label: "General",
    description: "Default — no adjustments",
  },
  {
    id: "student",
    label: "Student",
    description: "Higher sensitivity to rewards and urgency",
  },
  {
    id: "elderly",
    label: "Elderly",
    description: "Higher sensitivity to fear and authority",
  },
  {
    id: "business_owner",
    label: "Business",
    description: "Higher sensitivity to KYC and impersonation",
  },
];

export default function ProfileSelector({
  profile,
  onSelect,
  aiEnabled,
  onAiToggle,
}) {
  return (
    <div className="space-y-4">
      {/* Profile cards */}
      <div>
        <label className="block text-[10px] font-semibold text-gov-text uppercase tracking-wider mb-2">
          Risk Profile
        </label>
        <div className="grid grid-cols-2 gap-2">
          {PROFILES.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-xs transition-all ${
                profile === p.id
                  ? "bg-gov-accent/5 border-gov-accent text-gov-navy"
                  : "bg-white border-gov-border text-gov-muted hover:border-gray-400 hover:text-gov-text"
              }`}
            >
              <span className="font-semibold">{p.label}</span>
              <span className="text-[10px] text-center leading-tight text-gov-muted hidden sm:block">
                {p.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* AI toggle */}
      <div className="flex items-center justify-between bg-white border border-gov-border rounded-lg px-4 py-3">
        <div>
          <p className="text-sm font-medium text-gov-text">AI Analysis</p>
          <p className="text-[10px] text-gov-muted">
            Semantic fraud detection via BART model
          </p>
        </div>
        <button
          onClick={() => onAiToggle(!aiEnabled)}
          className={`relative w-11 h-6 rounded-full transition-colors ${
            aiEnabled ? "bg-gov-accent" : "bg-gray-300"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow ${
              aiEnabled ? "translate-x-5" : ""
            }`}
          />
        </button>
      </div>
    </div>
  );
}