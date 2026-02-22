"use client";

import { useState } from "react";
import { downloadReport } from "@/lib/api";

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
      setError(err.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleDownload}
        disabled={downloading || !analysisId}
        className="px-4 py-2 bg-sb-surface border border-sb-border rounded-xl text-xs font-medium text-sb-textSecondary hover:text-sb-text hover:border-sb-textMuted transition-all btn-press disabled:opacity-50"
      >
        {downloading ? "Generating..." : "Download PDF Report"}
      </button>
      {error && (
        <p className="text-[10px] text-risk-critical mt-1">{error}</p>
      )}
    </div>
  );
}