"use client";

/**
 * ProfileSelector
 * ----------------
 * Allows the user to select a risk profile that adjusts score emphasis.
 *
 * Props:
 *   profile: string          – current profile
 *   onSelect(profile: string)
 *   aiEnabled: boolean
 *   onAiToggle(enabled: boolean)
 */

const PROFILES = [
  {
    id: "general",
    label: "General",
    icon: "👤",
    description: "Default – no adjustments",
  },
  {
    id: "student",
    label: "Student",
    icon: "🎓",
    description: "Higher sensitivity to rewards & urgency",
  },
  {
    id: "elderly",
    label: "Elderly",
    icon: "👴",
    description: "Higher sensitivity to fear & authority",
  },
  {
    id: "business_owner",
    label: "Business",
    icon: "💼",
    description: "Higher sensitivity to KYC & impersonation",
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
        <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
          Risk Profile
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PROFILES.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-xs transition-all ${
                profile === p.id
                  ? "bg-suraksha-accent/10 border-suraksha-accent text-white"
                  : "bg-suraksha-card border-suraksha-border text-gray-400 hover:border-gray-500 hover:text-gray-200"
              }`}
            >
              <span className="text-xl">{p.icon}</span>
              <span className="font-medium">{p.label}</span>
              <span className="text-[10px] text-gray-500 text-center leading-tight hidden sm:block">
                {p.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* AI toggle */}
      <div className="flex items-center justify-between bg-suraksha-card border border-suraksha-border rounded-lg px-4 py-3">
        <div>
          <p className="text-sm font-medium text-gray-200">AI Analysis</p>
          <p className="text-xs text-gray-500">
            Uses BART-large-MNLI for semantic fraud detection
          </p>
        </div>
        <button
          onClick={() => onAiToggle(!aiEnabled)}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            aiEnabled ? "bg-suraksha-accent" : "bg-gray-700"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow ${
              aiEnabled ? "translate-x-6" : ""
            }`}
          />
        </button>
      </div>
    </div>
  );
}