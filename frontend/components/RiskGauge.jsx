"use client";

/**
 * RiskGauge – Risk-First Card
 * Large centered risk display that appears above all breakdown.
 * Government-style: white card, color-coded border, no flashiness.
 */
export default function RiskGauge({ score, riskLevel, categories }) {
  const config = {
    Low: {
      color: "#2E7D32",
      borderClass: "border-risk-low",
      textClass: "text-risk-low",
      bgClass: "bg-risk-low/5",
      message: "This message does not show significant indicators of fraud.",
    },
    Medium: {
      color: "#F9A825",
      borderClass: "border-risk-medium",
      textClass: "text-risk-medium",
      bgClass: "bg-risk-medium/5",
      message:
        "This message shows some indicators that may warrant caution.",
    },
    High: {
      color: "#EF6C00",
      borderClass: "border-risk-high",
      textClass: "text-risk-high",
      bgClass: "bg-risk-high/5",
      message:
        "This message shows strong indicators of potential fraud. Exercise caution.",
    },
    Critical: {
      color: "#C62828",
      borderClass: "border-risk-critical",
      textClass: "text-risk-critical",
      bgClass: "bg-risk-critical/5",
      message:
        "This message shows very strong indicators of fraud. Do not respond or click any links.",
    },
  };

  const c = config[riskLevel] || config.Low;

  return (
    <div
      className={`bg-white rounded-lg border-l-4 ${c.borderClass} shadow-sm p-6 sm:p-8`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Left: Risk label + score */}
        <div>
          <p className="text-xs font-medium text-gov-muted uppercase tracking-wider mb-1">
            Risk Assessment
          </p>
          <p className={`text-2xl sm:text-3xl font-bold ${c.textClass}`}>
            {riskLevel} Risk
          </p>
          <p className="text-sm text-gov-muted mt-1">
            Score: {score} / 100
          </p>
        </div>

        {/* Right: Score circle */}
        <div className="flex-shrink-0">
          <div
            className={`w-20 h-20 rounded-full ${c.bgClass} flex items-center justify-center`}
          >
            <span className={`text-2xl font-bold ${c.textClass}`}>
              {score}
            </span>
          </div>
        </div>
      </div>

      {/* Summary message */}
      <p className="text-sm text-gov-text mt-4 leading-relaxed">
        {c.message}
      </p>

      {/* Why it was flagged */}
      {categories && categories.length > 0 && (
        <div className="mt-5 pt-4 border-t border-gov-border">
          <p className="text-xs font-semibold text-gov-text uppercase tracking-wider mb-2">
            Why it was flagged
          </p>
          <ul className="space-y-1">
            {categories.map((cat) => (
              <li key={cat} className="text-sm text-gov-muted flex items-start gap-2">
                <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0`} style={{ backgroundColor: c.color }} />
                {_formatCategory(cat)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function _formatCategory(cat) {
  const labels = {
    urgency: "Urgency pressure",
    fear: "Fear-based manipulation",
    otp: "OTP / credential harvesting",
    personal_data: "Personal data solicitation",
    authority_impersonation: "Authority impersonation",
    reward_scam: "Reward / lottery scam",
    kyc_scam: "KYC fraud",
    financial_data_request: "Financial data request",
    dynamic_urgency: "Time-pressure tactics",
    social_impersonation: "Social / family impersonation",
    suspicious_url: "Suspicious URL detected",
    hindi_urgency: "Urgency pressure (Hindi)",
    hindi_fear: "Fear-based manipulation (Hindi)",
    hindi_otp_personal: "OTP / data solicitation (Hindi)",
    hindi_reward: "Reward scam (Hindi)",
    hindi_authority: "Authority impersonation (Hindi)",
    call_transcript: "Call transcript scam patterns",
    Fear: "Fear manipulation",
    Urgency: "Urgency manipulation",
    Authority: "Authority manipulation",
    Reward: "Reward manipulation",
    Scarcity: "Scarcity pressure",
    "Emotional Manipulation": "Emotional manipulation",
    "Financial Pressure": "Financial pressure",
    "Financial Coercion": "Financial coercion",
  };
  return labels[cat] || cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}