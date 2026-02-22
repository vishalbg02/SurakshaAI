"use client";

import { useState, useRef } from "react";

/**
 * MessageInput
 * Chat-style multiline textarea with explicit batch toggle
 * and optional call recording upload.
 */
export default function MessageInput({
  onSubmit,
  disabled,
  value,
  onChange,
  isBatchMode,
  onBatchToggle,
}) {
  const [uploadedFile, setUploadedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (!value.trim() || disabled) return;
    onSubmit(value.trim());
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = [
      "audio/mpeg",
      "audio/wav",
      "audio/mp3",
      "audio/x-wav",
      "audio/wave",
    ];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav)$/i)) {
      alert("Please upload an MP3 or WAV file.");
      return;
    }

    setUploadedFile(file.name);
    onChange(
      value +
        (value.trim() ? "\n" : "") +
        `[Call recording uploaded: ${file.name} — Transcription feature requires backend speech module.]`
    );
  };

  return (
    <div className="w-full space-y-3">
      {/* Batch toggle */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs text-gov-muted cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isBatchMode}
            onChange={(e) => onBatchToggle(e.target.checked)}
            className="rounded border-gov-border text-gov-accent focus:ring-gov-accent h-3.5 w-3.5"
          />
          Batch mode (analyze multiple messages, one per line)
        </label>
        {isBatchMode && (
          <span className="text-[10px] text-gov-muted">
            {value.split("\n").filter((l) => l.trim()).length} message(s)
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
            isBatchMode
              ? "Enter multiple messages, one per line..."
              : "Paste a suspicious SMS, WhatsApp message, or call transcript..."
          }
          className="w-full bg-white border border-gov-border rounded-lg px-4 py-3 text-sm text-gov-text placeholder-gray-400 resize-none disabled:opacity-50 transition-colors focus:border-gov-accent"
        />
        <span className="absolute bottom-3 right-3 text-[10px] text-gray-400">
          {value.length} chars
        </span>
      </div>

      {/* Action row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!value.trim() || disabled}
          className="px-6 py-2.5 bg-gov-navy hover:bg-blue-900 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {disabled ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Analyzing...
            </>
          ) : (
            <>{isBatchMode ? "Analyze Batch" : "Analyze Message"}</>
          )}
        </button>

        {/* Upload call recording */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="px-4 py-2.5 bg-white border border-gov-border text-sm text-gov-muted rounded-lg hover:border-gov-accent hover:text-gov-text transition-colors disabled:opacity-50"
        >
          Upload Call Recording (.mp3, .wav)
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".mp3,.wav,audio/mpeg,audio/wav"
          onChange={handleFileUpload}
          className="hidden"
        />

        {uploadedFile && (
          <span className="text-[10px] text-gov-muted truncate max-w-[200px]">
            Uploaded: {uploadedFile}
          </span>
        )}
      </div>

      <p className="text-[10px] text-gray-400">
        Press Ctrl+Enter to submit
      </p>
    </div>
  );
}