"use client";

import { useState } from "react";

/**
 * ScamSimulator
 * Educational flow, updated for government style.
 */

const SCENARIOS = [
  {
    id: "kyc",
    title: "KYC / Bank Fraud",
    steps: [
      { label: "Impersonation", description: "Scammer sends SMS pretending to be SBI, HDFC, or another bank." },
      { label: "Fear Trigger", description: "Claims your account will be blocked or KYC has expired." },
      { label: "Malicious Link", description: "Provides a typosquatted URL like sbi-kyc-update.in to steal credentials." },
      { label: "Data Theft", description: "Victim enters OTP, PAN, or Aadhaar — account compromised." },
    ],
  },
  {
    id: "reward",
    title: "Reward / Lottery Scam",
    steps: [
      { label: "Lucky Winner", description: "You receive a message saying you've won a cash prize or gift card." },
      { label: "Urgency", description: "Must 'claim within 24 hours' or the prize expires." },
      { label: "Fee Request", description: "Asked to pay a small 'processing fee' to receive the reward." },
      { label: "Money Lost", description: "No prize exists. The fee and any shared details are stolen." },
    ],
  },
  {
    id: "call",
    title: "Call Transcript Scam",
    steps: [
      { label: "Automated Call", description: "An IVR call claims to be from police, customs, or telecom authority." },
      { label: "Authority Pressure", description: "'Your number is involved in illegal activity. Press 1 to connect.'" },
      { label: "Intimidation", description: "A 'senior officer' threatens arrest unless you cooperate immediately." },
      { label: "Wire Transfer", description: "Victim is coerced into transferring money to a 'verification account'." },
    ],
  },
];

export default function ScamSimulator() {
  const [activeScenario, setActiveScenario] = useState(SCENARIOS[0].id);
  const [activeStep, setActiveStep] = useState(0);

  const scenario = SCENARIOS.find((s) => s.id === activeScenario);

  return (
    <div className="bg-white border border-gov-border rounded-lg p-5 space-y-5">
      <h3 className="text-xs font-semibold text-gov-text uppercase tracking-wider">
        How Scams Work — Educational Guide
      </h3>

      {/* Scenario tabs */}
      <div className="flex flex-wrap gap-2">
        {SCENARIOS.map((s) => (
          <button
            key={s.id}
            onClick={() => { setActiveScenario(s.id); setActiveStep(0); }}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
              activeScenario === s.id
                ? "bg-gov-navy/10 text-gov-navy border border-gov-navy/20"
                : "bg-gray-50 text-gov-muted border border-transparent hover:text-gov-text"
            }`}
          >
            {s.title}
          </button>
        ))}
      </div>

      {/* Progress */}
      <div className="flex items-center gap-1">
        {scenario.steps.map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-1 rounded-full transition-all cursor-pointer ${
              i <= activeStep ? "bg-gov-navy" : "bg-gray-200"
            }`}
            onClick={() => setActiveStep(i)}
          />
        ))}
      </div>

      {/* Step */}
      <div className="min-h-[80px]">
        <p className="text-sm font-semibold text-gov-text mb-1">
          Step {activeStep + 1}: {scenario.steps[activeStep].label}
        </p>
        <p className="text-sm text-gov-muted leading-relaxed">
          {scenario.steps[activeStep].description}
        </p>
      </div>

      {/* Nav */}
      <div className="flex items-center justify-between pt-2 border-t border-gov-border">
        <button
          onClick={() => setActiveStep((s) => Math.max(0, s - 1))}
          disabled={activeStep === 0}
          className="text-xs text-gov-muted hover:text-gov-text disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <span className="text-[10px] text-gov-muted">
          {activeStep + 1} / {scenario.steps.length}
        </span>
        <button
          onClick={() => setActiveStep((s) => Math.min(scenario.steps.length - 1, s + 1))}
          disabled={activeStep === scenario.steps.length - 1}
          className="text-xs text-gov-muted hover:text-gov-text disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}