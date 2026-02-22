"use client";

import { useState } from "react";

const SCENARIOS = [
  {
    id: "kyc",
    title: "KYC / Bank Fraud",
    steps: [
      { label: "Impersonation", desc: "Scammer sends SMS pretending to be SBI, HDFC, or another bank." },
      { label: "Fear Trigger", desc: "Claims your account will be blocked or KYC has expired." },
      { label: "Malicious Link", desc: "Provides a typosquatted URL like sbi-kyc-update.in." },
      { label: "Data Theft", desc: "Victim enters OTP, PAN, or Aadhaar — account compromised." },
    ],
  },
  {
    id: "reward",
    title: "Reward Scam",
    steps: [
      { label: "Lucky Winner", desc: "Message says you've won a cash prize or gift card." },
      { label: "Urgency", desc: "Must claim within 24 hours or it expires." },
      { label: "Fee Request", desc: "Asked to pay a processing fee to receive the reward." },
      { label: "Money Lost", desc: "No prize exists. Fee and shared details are stolen." },
    ],
  },
  {
    id: "call",
    title: "Call Scam",
    steps: [
      { label: "Automated Call", desc: "IVR call claims to be from police, customs, or telecom." },
      { label: "Authority", desc: "Your number is involved in illegal activity. Press 1." },
      { label: "Intimidation", desc: "Senior officer threatens arrest unless you cooperate." },
      { label: "Wire Transfer", desc: "Victim coerced into transferring money." },
    ],
  },
];

export default function ScamSimulator() {
  const [scenario, setScenario] = useState(SCENARIOS[0].id);
  const [step, setStep] = useState(0);
  const s = SCENARIOS.find((sc) => sc.id === scenario);

  return (
    <div className="bg-sb-card border border-sb-border rounded-2xl p-5 space-y-4 mt-8">
      <h3 className="text-xs font-semibold text-sb-textSecondary uppercase tracking-wider">
        How Scams Work
      </h3>

      <div className="flex flex-wrap gap-1.5">
        {SCENARIOS.map((sc) => (
          <button
            key={sc.id}
            onClick={() => { setScenario(sc.id); setStep(0); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              scenario === sc.id
                ? "bg-sb-accent/10 text-sb-accent border border-sb-accent/20"
                : "bg-sb-surface border border-sb-border text-sb-textMuted hover:text-sb-textSecondary"
            }`}
          >
            {sc.title}
          </button>
        ))}
      </div>

      {/* Progress */}
      <div className="flex items-center gap-1">
        {s.steps.map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-1 rounded-full cursor-pointer transition-all ${
              i <= step ? "bg-sb-accent" : "bg-sb-border"
            }`}
            onClick={() => setStep(i)}
          />
        ))}
      </div>

      <div className="min-h-[70px]">
        <p className="text-sm font-semibold text-sb-text mb-1">
          Step {step + 1}: {s.steps[step].label}
        </p>
        <p className="text-xs text-sb-textSecondary leading-relaxed">
          {s.steps[step].desc}
        </p>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-sb-border">
        <button
          onClick={() => setStep((v) => Math.max(0, v - 1))}
          disabled={step === 0}
          className="text-xs text-sb-textMuted hover:text-sb-text disabled:opacity-30 transition-colors"
        >
          Previous
        </button>
        <span className="text-[10px] text-sb-textMuted">
          {step + 1} / {s.steps.length}
        </span>
        <button
          onClick={() => setStep((v) => Math.min(s.steps.length - 1, v + 1))}
          disabled={step === s.steps.length - 1}
          className="text-xs text-sb-textMuted hover:text-sb-text disabled:opacity-30 transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}