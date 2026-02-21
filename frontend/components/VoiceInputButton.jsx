"use client";

import { useState, useRef, useEffect } from "react";

/**
 * VoiceInputButton
 * -----------------
 * Uses the Web Speech API (SpeechRecognition) to capture voice input
 * and appends the transcript to the parent textarea via onTranscript().
 *
 * Props:
 *   onTranscript(text: string) – called with each recognised transcript chunk
 *   disabled: boolean
 */
export default function VoiceInputButton({ onTranscript, disabled }) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Check browser support
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
    recognition.lang = "en-IN"; // Supports English + Hinglish

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

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      recognitionRef.current.start();
      setListening(true);
    }
  };

  if (!supported) {
    return (
      <button
        disabled
        title="Voice input not supported in this browser"
        className="px-3 py-2.5 bg-gray-800 text-gray-600 rounded-lg text-sm cursor-not-allowed"
      >
        🎙️ Not Supported
      </button>
    );
  }

  return (
    <button
      onClick={toggleListening}
      disabled={disabled}
      title={listening ? "Stop listening" : "Start voice input"}
      className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
        listening
          ? "bg-red-500/20 text-red-400 border border-red-500/50 animate-pulse"
          : "bg-suraksha-card border border-suraksha-border text-gray-300 hover:border-suraksha-accent hover:text-white"
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <span className="text-base">{listening ? "⏹️" : "🎙️"}</span>
      {listening ? "Listening…" : "Voice"}
    </button>
  );
}