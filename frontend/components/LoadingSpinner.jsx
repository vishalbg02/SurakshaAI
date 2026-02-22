"use client";

export default function LoadingSpinner({ message = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-8 h-8 border-2 border-sb-border border-t-sb-accent rounded-full animate-spin" />
      <p className="text-sm text-sb-textMuted">{message}</p>
    </div>
  );
}