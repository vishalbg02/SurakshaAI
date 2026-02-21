"use client";

import { useState } from "react";

/**
 * MessageInput
 * -------------
 * Chat-style multiline textarea with submit button.
 * Supports batch mode (newline-separated messages).
 *
 * Props:
 *   onSubmit(text: string)  – called with the raw textarea value
 *   disabled: boolean       – disables input during loading
 *   value: string           – controlled value (for voice input append)
 *   onChange(text: string)   – controlled change handler
 */
export default function MessageInput({ onSubmit, disabled, value, onChange }) {
  const [isBatch, setIsBatch] = useState(false);

  const handleKeyDown = (e) => {
    // Ctrl/Cmd + Enter to submit
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (!value.trim() || disabled) return;
    onSubmit(value.trim());
  };

  const lineCount = value.split("\n").filter((l) => l.trim()).length;

  return (
    <div className="w-full">
      {/* Batch toggle */}
      <div className="flex items-center justify-between mb-2">
        <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isBatch}
            onChange={(e) => setIsBatch(e.target.checked)}
            className="rounded border-suraksha-border bg-suraksha-dark text-suraksha-accent focus:ring-suraksha-accent"
          />
          Batch mode (one message per line)
        </label>
        {isBatch && lineCount > 1 && (
          <span className="text-xs text-gray-500">
            {lineCount} messages detected
          </span>
        )}
      </div>

      {/* Textarea */}
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={5}
          placeholder={
            isBatch
              ? "Paste multiple suspicious messages, one per line…"
              : "Paste a suspicious SMS, WhatsApp message, or call transcript…"
          }
          className="w-full bg-suraksha-card border border-suraksha-border rounded-xl px-4 py-3 text-sm text-gray-100 placeholder-gray-500 resize-none disabled:opacity-50 transition-colors focus:border-suraksha-accent"
        />

        {/* Character count */}
        <span className="absolute bottom-3 right-3 text-xs text-gray-600">
          {value.length} chars
        </span>
      </div>

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={!value.trim() || disabled}
        className="mt-3 w-full sm:w-auto px-6 py-2.5 bg-suraksha-accent hover:bg-blue-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {disabled ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Analyzing…
          </>
        ) : (
          <>
            <span>🔍</span>
            {isBatch ? "Analyze Batch" : "Analyze Message"}
          </>
        )}
      </button>

      <p className="mt-2 text-xs text-gray-600">
        Press Ctrl+Enter to submit
      </p>
    </div>
  );
}