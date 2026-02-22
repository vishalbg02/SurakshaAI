"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { getTrends, getHistory } from "@/lib/api";
import LoadingSpinner from "@/components/LoadingSpinner";

const TrendDashboard = dynamic(
  () => import("@/components/TrendDashboard"),
  {
    ssr: false,
    loading: () => (
      <div className="bg-white border border-gov-border rounded-lg p-10 text-center">
        <p className="text-sm text-gov-muted">Loading charts...</p>
      </div>
    ),
  }
);

const RISK_BADGE = {
  Low: "bg-risk-low/10 text-risk-low",
  Medium: "bg-risk-medium/10 text-risk-medium",
  High: "bg-risk-high/10 text-risk-high",
  Critical: "bg-risk-critical/10 text-risk-critical",
};

export default function DashboardPage() {
  const [trends, setTrends] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [trendsRes, historyRes] = await Promise.all([
          getTrends(),
          getHistory(50),
        ]);
        setTrends(trendsRes.data);
        setHistory(historyRes.results);
      } catch (err) {
        setError(err.message || "Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const [trendsRes, historyRes] = await Promise.all([
        getTrends(),
        getHistory(50),
      ]);
      setTrends(trendsRes.data);
      setHistory(historyRes.results);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gov-navy">
            Analytics Dashboard
          </h1>
          <p className="text-sm text-gov-muted mt-1">
            Aggregate trends across all analyzed messages.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="px-4 py-2 bg-white border border-gov-border rounded-lg text-sm text-gov-muted hover:border-gov-accent hover:text-gov-text transition-all disabled:opacity-50"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </section>

      {loading && !trends && <LoadingSpinner message="Loading dashboard..." />}

      {error && (
        <div className="bg-white border border-risk-critical/20 rounded-lg p-5">
          <p className="text-sm text-risk-critical">{error}</p>
          <button onClick={() => setError(null)} className="mt-2 text-xs text-risk-critical underline">
            Dismiss
          </button>
        </div>
      )}

      {trends && <TrendDashboard trends={trends} />}

      {/* History Table */}
      {history && (
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-gov-navy uppercase tracking-wider">
            Recent Analyses
            <span className="text-xs font-normal text-gov-muted ml-2">
              ({history.length} records)
            </span>
          </h2>

          {history.length === 0 ? (
            <div className="bg-white border border-gov-border rounded-lg p-10 text-center">
              <p className="text-gov-muted text-sm">
                No analyses yet.{" "}
                <a href="/" className="text-gov-accent underline">
                  Analyze a message
                </a>{" "}
                to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto bg-white border border-gov-border rounded-lg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gov-border bg-gray-50">
                    <th className="text-left text-[10px] font-semibold text-gov-muted uppercase tracking-wider py-3 px-3">ID</th>
                    <th className="text-left text-[10px] font-semibold text-gov-muted uppercase tracking-wider py-3 px-3">Message</th>
                    <th className="text-center text-[10px] font-semibold text-gov-muted uppercase tracking-wider py-3 px-3">Final</th>
                    <th className="text-center text-[10px] font-semibold text-gov-muted uppercase tracking-wider py-3 px-3">Risk</th>
                    <th className="text-center text-[10px] font-semibold text-gov-muted uppercase tracking-wider py-3 px-3">Profile</th>
                    <th className="text-right text-[10px] font-semibold text-gov-muted uppercase tracking-wider py-3 px-3">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((row) => (
                    <tr key={row.id} className="border-b border-gov-border/50 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-3 text-gov-muted font-mono text-xs">#{row.id}</td>
                      <td className="py-3 px-3 max-w-[250px]">
                        <p className="text-xs text-gov-text truncate" title={row.message}>{row.message}</p>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="text-xs font-mono font-bold text-gov-text">{row.final_score}</span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${RISK_BADGE[row.risk_level] || "bg-gray-100 text-gov-muted"}`}>
                          {row.risk_level}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="text-[10px] text-gov-muted capitalize">{row.profile_used}</span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="text-[10px] text-gov-muted font-mono">{new Date(row.timestamp).toLocaleString()}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}