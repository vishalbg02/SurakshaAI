"use client";

import { useState, useRef, useEffect } from "react";

/**
 * VoiceInputButton
 * Uses Web Speech API with proper listening state,
 * error handling, and stop functionality.
 */
export default function VoiceInputButton({ onTranscript, disabled }) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition =
      typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);

    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-IN";

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          transcript += event.results[i][0].transcript;
        }
      }
      if (transcript.trim()) {
        onTranscript(transcript.trim());
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setListening(false);

      if (event.error === "not-allowed") {
        setError("Microphone access denied. Please allow microphone permissions.");
      } else if (event.error === "no-speech") {
        setError("No speech detected. Please try again.");
      } else if (event.error === "network") {
        setError("Network error. Speech recognition requires an internet connection.");
      } else {
        setError(`Speech error: ${event.error}`);
      }

      setTimeout(() => setError(null), 5000);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startListening = () => {
    if (!recognitionRef.current) return;
    setError(null);
    try {
      recognitionRef.current.start();
      setListening(true);
    } catch (err) {
      setError("Could not start voice input. Please try again.");
      console.error("Start error:", err);
    }
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setListening(false);
  };

  if (!supported) {
    return (
      <div className="text-[10px] text-gov-muted border border-gov-border rounded-lg px-3 py-2">
        Voice input not supported in this browser.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1">
      {listening ? (
        <button
          onClick={stopListening}
          className="px-4 py-2.5 rounded-lg text-sm font-medium bg-risk-critical/10 text-risk-critical border border-risk-critical/30 transition-all flex items-center gap-2"
        >
          {/* Red pulsing dot */}
          <span className="relative flex h-2.5 w-2.5">
            <span className="listening-pulse absolute inline-flex h-full w-full rounded-full bg-risk-critical opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-risk-critical" />
          </span>
          Listening... (click to stop)
        </button>
      ) : (
        <button
          onClick={startListening}
          disabled={disabled}
          className="px-4 py-2.5 rounded-lg text-sm font-medium bg-white border border-gov-border text-gov-muted hover:border-gov-accent hover:text-gov-text transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Voice Input
        </button>
      )}
      {error && (
        <p className="text-[10px] text-risk-critical max-w-[250px]">{error}</p>
      )}
    </div>
  );
}