"use client";

import { useState } from "react";

/**
 * ScamSimulator
 * --------------
 * A static 4-step visual flow showing how common scam tactics work.
 * Educational only — no backend calls.
 *
 * Each scenario maps to a rule-engine category.
 */

const SCENARIOS = [
  {
    id: "kyc",
    title: "KYC / Bank Fraud",
    icon: "🏦",
    color: "text-red-400",
    steps: [
      {
        label: "Impersonation",
        description: "Scammer sends SMS pretending to be SBI, HDFC, or another bank.",
        icon: "👤",
      },
      {
        label: "Fear Trigger",
        description: "Claims your account will be blocked or KYC has expired.",
        icon: "😨",
      },
      {
        label: "Malicious Link",
        description: "Provides a typosquatted URL like sbi-kyc-update.in to steal credentials.",
        icon: "🔗",
      },
      {
        label: "Data Theft",
        description: "Victim enters OTP, PAN, or Aadhaar — account compromised.",
        icon: "💀",
      },
    ],
  },
  {
    id: "reward",
    title: "Reward / Lottery Scam",
    icon: "🎰",
    color: "text-yellow-400",
    steps: [
      {
        label: "Lucky Winner",
        description: "You receive a message saying you've won a cash prize or gift card.",
        icon: "🎉",
      },
      {
        label: "Urgency",
        description: "Must 'claim within 24 hours' or the prize expires.",
        icon: "⏰",
      },
      {
        label: "Fee Request",
        description: "Asked to pay a small 'processing fee' to receive the reward.",
        icon: "💸",
      },
      {
        label: "Money Lost",
        description: "No prize exists. The fee and any shared details are stolen.",
        icon: "🚫",
      },
    ],
  },
  {
    id: "call",
    title: "Call Transcript Scam",
    icon: "📞",
    color: "text-purple-400",
    steps: [
      {
        label: "Automated Call",
        description: "An IVR call claims to be from police, customs, or telecom authority.",
        icon: "🤖",
      },
      {
        label: "Authority Pressure",
        description: "'Your number is involved in illegal activity. Press 1 to connect.'",
        icon: "👮",
      },
      {
        label: "Intimidation",
        description: "A 'senior officer' threatens arrest unless you cooperate immediately.",
        icon: "⚖️",
      },
      {
        label: "Wire Transfer",
        description: "Victim is coerced into transferring money to a 'verification account'.",
        icon: "💀",
      },
    ],
  },
];

export default function ScamSimulator() {
  const [activeScenario, setActiveScenario] = useState(SCENARIOS[0].id);
  const [activeStep, setActiveStep] = useState(0);

  const scenario = SCENARIOS.find((s) => s.id === activeScenario);

  return (
    <div className="bg-suraksha-card border border-suraksha-border rounded-xl p-5 space-y-5">
      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
        <span>🎓</span>
        Scam Simulator — How Scams Work
      </h3>

      {/* Scenario tabs */}
      <div className="flex flex-wrap gap-2">
        {SCENARIOS.map((s) => (
          <button
            key={s.id}
            onClick={() => {
              setActiveScenario(s.id);
              setActiveStep(0);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeScenario === s.id
                ? "bg-suraksha-accent/15 text-suraksha-accent border border-suraksha-accent/30"
                : "bg-gray-800 text-gray-400 border border-transparent hover:text-gray-200"
            }`}
          >
            {s.icon} {s.title}
          </button>
        ))}
      </div>

      {/* Step progress bar */}
      <div className="flex items-center gap-1">
        {scenario.steps.map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-1.5 rounded-full transition-all cursor-pointer ${
              i <= activeStep ? "bg-suraksha-accent" : "bg-gray-700"
            }`}
            onClick={() => setActiveStep(i)}
          />
        ))}
      </div>

      {/* Active step display */}
      <div className="flex items-start gap-4 min-h-[100px]">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center text-2xl">
          {scenario.steps[activeStep].icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-white mb-1">
            Step {activeStep + 1}: {scenario.steps[activeStep].label}
          </p>
          <p className="text-sm text-gray-400 leading-relaxed">
            {scenario.steps[activeStep].description}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2 border-t border-suraksha-border">
        <button
          onClick={() => setActiveStep((s) => Math.max(0, s - 1))}
          disabled={activeStep === 0}
          className="text-xs text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          ← Previous
        </button>
        <span className="text-xs text-gray-600">
          {activeStep + 1} / {scenario.steps.length}
        </span>
        <button
          onClick={() =>
            setActiveStep((s) => Math.min(scenario.steps.length - 1, s + 1))
          }
          disabled={activeStep === scenario.steps.length - 1}
          className="text-xs text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Next →
        </button>
      </div>
    </div>
  );
}