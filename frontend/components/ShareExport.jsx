"use client";

import { useState } from "react";
import { downloadReport } from "@/lib/api";

/**
 * ShareExport
 * PDF download button, updated for government style.
 */
export default function ShareExport({ analysisId }) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);

  const handleDownload = async () => {
    if (!analysisId) return;
    setDownloading(true);
    setError(null);

    try {
      const blob = await downloadReport(analysisId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `suraksha_report_${analysisId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
      setError(err.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        onClick={handleDownload}
        disabled={downloading || !analysisId}
        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gov-border rounded-lg text-sm font-medium text-gov-muted hover:border-gov-accent hover:text-gov-text transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {downloading ? (
          <>
            <span className="w-3.5 h-3.5 border-2 border-gray-400 border-t-gov-navy rounded-full animate-spin" />
            Generating PDF...
          </>
        ) : (
          "Download PDF Report"
        )}
      </button>
      {error && <p className="text-[10px] text-risk-critical">{error}</p>}
    </div>
  );
}