"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

/**
 * TrendDashboard – Clean government-style analytics.
 * 4 summary cards + bar chart.
 */

const RISK_COLORS = {
  Low: "#2E7D32",
  Medium: "#F9A825",
  High: "#EF6C00",
  Critical: "#C62828",
};

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gov-border rounded-lg px-3 py-2 shadow-sm">
      <p className="text-xs font-semibold" style={{ color: RISK_COLORS[label] }}>
        {label}
      </p>
      <p className="text-xs text-gov-muted">{payload[0].value} analyses</p>
    </div>
  );
}

export default function TrendDashboard({ trends }) {
  if (!trends) return null;

  const { risk_distribution, most_common_scam_category, most_common_psych_trigger } =
    trends;

  const chartData = Object.entries(risk_distribution).map(([level, count]) => ({
    name: level,
    count,
  }));

  const total = Object.values(risk_distribution).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Total Analyzed" value={total} />
        <SummaryCard
          label="Most Common Scam"
          value={most_common_scam_category || "N/A"}
          isText
        />
        <SummaryCard
          label="Top Psych Tactic"
          value={most_common_psych_trigger || "N/A"}
          isText
        />
        <SummaryCard
          label="Risk Snapshot"
          custom={
            <div className="flex items-center gap-2 mt-1">
              {Object.entries(risk_distribution).map(([level, count]) => (
                <span
                  key={level}
                  className="text-xs font-mono"
                  style={{ color: RISK_COLORS[level] }}
                >
                  {level[0]}:{count}
                </span>
              ))}
            </div>
          }
        />
      </div>

      {/* Bar Chart */}
      <div className="bg-white border border-gov-border rounded-lg p-5">
        <h3 className="text-xs font-semibold text-gov-text uppercase tracking-wider mb-6">
          Risk Distribution
        </h3>
        {total === 0 ? (
          <p className="text-sm text-gov-muted text-center py-10">
            No analyses recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                  axisLine={{ stroke: "#E5E7EB" }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                  axisLine={{ stroke: "#E5E7EB" }}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.02)" }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={RISK_COLORS[entry.name] || "#6B7280"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, isText, custom }) {
  return (
    <div className="bg-white border border-gov-border rounded-lg p-4">
      <p className="text-[10px] text-gov-muted uppercase tracking-wider mb-1">
        {label}
      </p>
      {custom ? (
        custom
      ) : isText ? (
        <p className="text-sm font-semibold text-gov-text truncate">
          {value?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
        </p>
      ) : (
        <p className="text-2xl font-bold text-gov-navy">{value}</p>
      )}
    </div>
  );
}