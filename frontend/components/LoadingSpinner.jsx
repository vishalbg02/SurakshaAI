"use client";

/**
 * LoadingSpinner
 * Clean, minimal loading indicator for government style.
 */
export default function LoadingSpinner({ message = "Analyzing..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-10 h-10 border-3 border-gray-200 border-t-gov-navy rounded-full animate-spin" />
      <p className="text-sm text-gov-muted">{message}</p>
    </div>
  );
}