"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { getTrends, getHistory } from "@/lib/api";

const TrendCharts = dynamic(() => import("@/components/TrendCharts"), {
  ssr: false,
  loading: () => (
    <div className="bg-sb-card border border-sb-border rounded-2xl p-10 text-center">
      <div className="skeleton h-4 w-32 rounded mx-auto mb-4" />
      <div className="skeleton h-48 w-full rounded-xl" />
    </div>
  ),
});

const RISK_COLORS = {
  Low: "#10B981", Medium: "#F59E0B", High: "#F97316", Critical: "#EF4444",
};

export default function DashboardPage() {
  const [trends, setTrends] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true); setError(null);
    try {
      const [t, h] = await Promise.all([getTrends(), getHistory(50)]);
      setTrends(t.data); setHistory(h.results);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const total = trends ? Object.values(trends.risk_distribution).reduce((a, b) => a + b, 0) : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-sb-text tracking-tight">Dashboard</h1>
          <p className="text-sm text-sb-textSecondary mt-0.5">Aggregate intelligence across all analyses.</p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="px-4 py-2 bg-sb-card border border-sb-border rounded-xl text-xs font-medium text-sb-textSecondary hover:text-sb-text hover:border-sb-textMuted transition-all btn-press disabled:opacity-50"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="bg-risk-criticalBg border border-risk-critical/20 rounded-2xl p-5 animate-fade-in">
          <p className="text-sm text-risk-critical">{error}</p>
        </div>
      )}

      {loading && !trends && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-24 rounded-2xl" />
          ))}
        </div>
      )}

      {trends && (
        <>
          {/* Metric cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
            <MetricCard label="Total Analyzed" value={total} />
            <MetricCard
              label="Top Scam Type"
              value={trends.most_common_scam_category?.replace(/_/g, " ") || "N/A"}
              isText
            />
            <MetricCard
              label="Top Psych Tactic"
              value={trends.most_common_psych_trigger || "N/A"}
              isText
            />
            <div className="bg-sb-card border border-sb-border rounded-2xl p-4 card-hover">
              <p className="text-[10px] text-sb-textMuted uppercase tracking-wider mb-2">
                Distribution
              </p>
              <div className="flex items-center gap-1.5">
                {Object.entries(trends.risk_distribution).map(([level, count]) => (
                  <div key={level} className="flex-1 text-center">
                    <p className="text-sm font-bold" style={{ color: RISK_COLORS[level] }}>
                      {count}
                    </p>
                    <p className="text-[9px] text-sb-textMuted">{level}</p>
                    {total > 0 && (
                      <p className="text-[9px] text-sb-textMuted">
                        {((count / total) * 100).toFixed(0)}%
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <TrendCharts trends={trends} />
        </>
      )}

      {/* History Table */}
      {history && (
        <div className="animate-fade-in">
          <h2 className="text-xs font-semibold text-sb-textSecondary uppercase tracking-wider mb-3">
            Recent Analyses{" "}
            <span className="text-sb-textMuted font-normal">({history.length})</span>
          </h2>

          {history.length === 0 ? (
            <div className="bg-sb-card border border-sb-border rounded-2xl p-10 text-center">
              <p className="text-sm text-sb-textMuted">
                No analyses yet.{" "}
                <a href="/analyzer" className="text-sb-accent underline">
                  Analyze a message
                </a>{" "}
                to begin.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto bg-sb-card border border-sb-border rounded-2xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-sb-border">
                    <th className="text-left text-[10px] font-medium text-sb-textMuted uppercase tracking-wider py-3 px-4">
                      ID
                    </th>
                    <th className="text-left text-[10px] font-medium text-sb-textMuted uppercase tracking-wider py-3 px-4">
                      Message
                    </th>
                    <th className="text-center text-[10px] font-medium text-sb-textMuted uppercase tracking-wider py-3 px-4">
                      Score
                    </th>
                    <th className="text-center text-[10px] font-medium text-sb-textMuted uppercase tracking-wider py-3 px-4">
                      Risk
                    </th>
                    <th className="text-right text-[10px] font-medium text-sb-textMuted uppercase tracking-wider py-3 px-4">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-sb-border/50 hover:bg-sb-hover transition-colors"
                    >
                      <td className="py-3 px-4 text-sb-textMuted font-mono text-xs">
                        #{row.id}
                      </td>
                      <td className="py-3 px-4 max-w-[280px]">
                        <p
                          className="text-xs text-sb-textSecondary truncate"
                          title={row.message}
                        >
                          {row.message}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-xs font-mono font-bold text-sb-text">
                          {row.final_score}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full"
                          style={{
                            backgroundColor:
                              {
                                Low: "rgba(16,185,129,0.08)",
                                Medium: "rgba(245,158,11,0.08)",
                                High: "rgba(249,115,22,0.08)",
                                Critical: "rgba(239,68,68,0.08)",
                              }[row.risk_level] || "rgba(107,114,128,0.08)",
                            color: RISK_COLORS[row.risk_level] || "#6B7280",
                          }}
                        >
                          {row.risk_level}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-[10px] text-sb-textMuted font-mono">
                          {new Date(row.timestamp).toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, isText }) {
  return (
    <div className="bg-sb-card border border-sb-border rounded-2xl p-4 card-hover">
      <p className="text-[10px] text-sb-textMuted uppercase tracking-wider mb-1">
        {label}
      </p>
      {isText ? (
        <p className="text-sm font-semibold text-sb-text truncate capitalize">
          {value}
        </p>
      ) : (
        <p className="text-2xl font-bold text-sb-text">{value}</p>
      )}
    </div>
  );
}