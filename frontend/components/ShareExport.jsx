"use client";

import { useState } from "react";
import { downloadReport } from "@/lib/api";

/**
 * ShareExport
 * ------------
 * Button to download the PDF report for a specific analysis.
 *
 * Props:
 *   analysisId: number
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

      // Create a temporary download link
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
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-suraksha-card border border-suraksha-border rounded-lg text-sm font-medium text-gray-300 hover:border-suraksha-accent hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {downloading ? (
          <>
            <span className="w-4 h-4 border-2 border-gray-500 border-t-white rounded-full animate-spin" />
            Generating PDF…
          </>
        ) : (
          <>
            <span>📄</span>
            Download PDF Report
          </>
        )}
      </button>

      {error && (
        <p className="text-xs text-red-400">⚠️ {error}</p>
      )}
    </div>
  );
}