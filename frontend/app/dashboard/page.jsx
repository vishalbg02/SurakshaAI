"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { getTrends, getHistory } from "@/lib/api";

const Charts = dynamic(() => import("@/components/TrendCharts"), { ssr: false, loading: () => <div className="skel h-72 rounded-2xl" /> });

const RC = { Low: "#10B981", Medium: "#F59E0B", High: "#F97316", Critical: "#EF4444" };
const RG = { Low: "rgba(16,185,129,0.08)", Medium: "rgba(245,158,11,0.08)", High: "rgba(249,115,22,0.08)", Critical: "rgba(239,68,68,0.08)" };

export default function DashboardPage() {
  const [trends, setTrends] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("All");
  const [expanded, setExpanded] = useState(null);

  const fetchData = async () => {
    setLoading(true); setErr(null);
    try {
      const [t, h] = await Promise.all([getTrends(), getHistory(100)]);
      setTrends(t.data); setHistory(h.results);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const total = trends ? Object.values(trends.risk_distribution).reduce((a, b) => a + b, 0) : 0;

  const filtered = (history || []).filter((r) => {
    const matchSearch = !search.trim() || r.message.toLowerCase().includes(search.toLowerCase());
    const matchRisk = riskFilter === "All" || r.risk_level === riskFilter;
    return matchSearch && matchRisk;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-cx-text tracking-tight">Intelligence Dashboard</h1>
          <p className="text-sm text-cx-textSec mt-0.5">Aggregate threat intelligence across all analyses.</p>
        </div>
        <button onClick={fetchData} disabled={loading} className="px-4 py-2 bg-cx-card border border-cx-border rounded-xl text-[11px] font-medium text-cx-textDim hover:text-cx-textSec hover:border-cx-borderLight transition-all btn-press disabled:opacity-40">
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {err && (
        <div className="bg-risk-critGlow border border-risk-crit/15 rounded-2xl p-5 animate-fade-in">
          <p className="text-sm text-risk-crit">{err}</p>
          <button onClick={() => setErr(null)} className="text-[10px] text-risk-crit/60 underline mt-1">Dismiss</button>
        </div>
      )}

      {/* Skeleton */}
      {loading && !trends && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="skel h-28 rounded-2xl" />)}
        </div>
      )}

      {trends && (
        <>
          {/* Narrative */}
          <div className="bg-cx-card border border-cx-border rounded-2xl p-5 animate-fade-in">
            <p className="text-sm text-cx-textSec leading-relaxed">
              {total === 0 ? (
                "No analyses recorded yet. Start by analyzing a message."
              ) : (
                <>
                  <span className="text-cx-text font-semibold">{total}</span> messages analyzed.
                  {trends.risk_distribution.Critical > 0 && (
                    <> <span className="text-risk-crit font-semibold">{((trends.risk_distribution.Critical / total) * 100).toFixed(0)}%</span> classified as Critical risk. </>
                  )}
                  {trends.most_common_scam_category && trends.most_common_scam_category !== "N/A" && (
                    <> Most common attack vector: <span className="text-cx-accent font-semibold">{trends.most_common_scam_category.replace(/_/g, " ")}</span>. </>
                  )}
                  {trends.most_common_psych_trigger && trends.most_common_psych_trigger !== "N/A" && (
                    <> Primary manipulation tactic: <span className="text-cx-violet font-semibold">{trends.most_common_psych_trigger}</span>. </>
                  )}
                </>
              )}
            </p>
          </div>

          {/* Metric cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
            <MetricCard label="Total Analyzed" value={total} />
            <MetricCard label="Top Attack Vector" value={trends.most_common_scam_category?.replace(/_/g, " ") || "N/A"} isText />
            <MetricCard label="Top Psych Tactic" value={trends.most_common_psych_trigger || "N/A"} isText />
            <div className="bg-cx-card border border-cx-border rounded-2xl p-4 card-lift">
              <p className="text-[9px] text-cx-textGhost uppercase tracking-wider mb-2">Distribution</p>
              <div className="flex items-center gap-1">
                {Object.entries(trends.risk_distribution).map(([level, count]) => (
                  <div key={level} className="flex-1 text-center">
                    <p className="text-sm font-bold" style={{ color: RC[level] }}>{count}</p>
                    <p className="text-[8px] text-cx-textGhost">{level}</p>
                    {total > 0 && <p className="text-[8px] text-cx-textGhost">{((count / total) * 100).toFixed(0)}%</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chart */}
          <Charts trends={trends} />
        </>
      )}

      {/* History */}
      {history && (
        <div className="animate-fade-in space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h2 className="text-xs font-semibold text-cx-textSec uppercase tracking-wider">
              Analysis History <span className="text-cx-textGhost font-normal">({filtered.length})</span>
            </h2>
            <div className="flex items-center gap-2">
              {/* Search */}
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search messages..."
                className="bg-cx-surface border border-cx-border rounded-lg px-3 py-1.5 text-[11px] text-cx-text placeholder-cx-textGhost w-48 focus:border-cx-accent/40 transition-colors"
              />
              {/* Risk filter */}
              <div className="flex gap-1">
                {["All", "Low", "Medium", "High", "Critical"].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRiskFilter(r)}
                    className={`px-2 py-1 rounded text-[9px] font-medium transition-all ${
                      riskFilter === r
                        ? r === "All"
                          ? "bg-cx-accentGlow text-cx-accent"
                          : ""
                        : "bg-cx-surface text-cx-textGhost hover:text-cx-textDim"
                    }`}
                    style={
                      riskFilter === r && r !== "All"
                        ? { backgroundColor: RG[r], color: RC[r] }
                        : {}
                    }
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="bg-cx-card border border-cx-border rounded-2xl p-10 text-center">
              <p className="text-sm text-cx-textDim">
                {history.length === 0 ? (
                  <>No analyses yet. <a href="/analyzer" className="text-cx-accent underline">Analyze a message</a> to begin.</>
                ) : (
                  "No results match your search or filter."
                )}
              </p>
            </div>
          ) : (
            <div className="bg-cx-card border border-cx-border rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-cx-border">
                    <th className="text-left text-[9px] font-semibold text-cx-textGhost uppercase tracking-wider py-3 px-4">ID</th>
                    <th className="text-left text-[9px] font-semibold text-cx-textGhost uppercase tracking-wider py-3 px-4">Message</th>
                    <th className="text-center text-[9px] font-semibold text-cx-textGhost uppercase tracking-wider py-3 px-4">Score</th>
                    <th className="text-center text-[9px] font-semibold text-cx-textGhost uppercase tracking-wider py-3 px-4">Risk</th>
                    <th className="text-center text-[9px] font-semibold text-cx-textGhost uppercase tracking-wider py-3 px-4">Profile</th>
                    <th className="text-right text-[9px] font-semibold text-cx-textGhost uppercase tracking-wider py-3 px-4">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <>
                      <tr
                        key={row.id}
                        onClick={() => setExpanded(expanded === row.id ? null : row.id)}
                        className="border-b border-cx-border/30 hover:bg-cx-cardHover transition-colors cursor-pointer"
                      >
                        <td className="py-3 px-4 text-cx-textDim font-mono text-[10px]">#{row.id}</td>
                        <td className="py-3 px-4 max-w-[300px]">
                          <p className="text-[11px] text-cx-textSec truncate" title={row.message}>{row.message}</p>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-[11px] font-mono font-bold text-cx-text">{row.final_score}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className="text-[9px] font-bold px-2.5 py-0.5 rounded-full"
                            style={{ backgroundColor: RG[row.risk_level] || "rgba(107,114,128,0.08)", color: RC[row.risk_level] || "#6B7280" }}
                          >
                            {row.risk_level}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-[9px] text-cx-textGhost capitalize">{row.profile_used}</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-[9px] text-cx-textGhost font-mono">{new Date(row.timestamp).toLocaleString()}</span>
                        </td>
                      </tr>
                      {/* Expanded row */}
                      {expanded === row.id && (
                        <tr key={`${row.id}-exp`}>
                          <td colSpan={6} className="bg-cx-base/50 px-6 py-4 border-b border-cx-border/30">
                            <p className="text-[11px] text-cx-textSec leading-relaxed whitespace-pre-wrap font-mono">{row.message}</p>
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {(row.categories || []).map((c) => (
                                <span key={c} className="text-[8px] px-2 py-0.5 bg-cx-card border border-cx-border rounded text-cx-textDim">{c.replace(/_/g, " ")}</span>
                              ))}
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-[9px] text-cx-textGhost">
                              <span>Rule: {row.rule_score}</span>
                              <span>AI: {(row.ai_score * 100).toFixed(0)}%</span>
                              <span>Psych: {row.psych_score}</span>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
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
    <div className="bg-cx-card border border-cx-border rounded-2xl p-4 card-lift">
      <p className="text-[9px] text-cx-textGhost uppercase tracking-wider mb-1">{label}</p>
      {isText ? (
        <p className="text-sm font-semibold text-cx-text truncate capitalize">{value}</p>
      ) : (
        <p className="text-2xl font-bold text-cx-text">{value}</p>
      )}
    </div>
  );
}