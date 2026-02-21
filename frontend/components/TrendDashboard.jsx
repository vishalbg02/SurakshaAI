"use client";

import dynamic from "next/dynamic";

/*
 * Recharts components use browser-only APIs (ResizeObserver, window, document).
 * They CANNOT be server-rendered. We lazy-import them so they only load on
 * the client, preventing SSR crashes and hydration mismatches.
 */
const BarChart = dynamic(
  () => import("recharts").then((mod) => mod.BarChart),
  { ssr: false }
);
const Bar = dynamic(
  () => import("recharts").then((mod) => mod.Bar),
  { ssr: false }
);
const XAxis = dynamic(
  () => import("recharts").then((mod) => mod.XAxis),
  { ssr: false }
);
const YAxis = dynamic(
  () => import("recharts").then((mod) => mod.YAxis),
  { ssr: false }
);
const CartesianGrid = dynamic(
  () => import("recharts").then((mod) => mod.CartesianGrid),
  { ssr: false }
);
const Tooltip = dynamic(
  () => import("recharts").then((mod) => mod.Tooltip),
  { ssr: false }
);
const ResponsiveContainer = dynamic(
  () => import("recharts").then((mod) => mod.ResponsiveContainer),
  { ssr: false }
);
const Cell = dynamic(
  () => import("recharts").then((mod) => mod.Cell),
  { ssr: false }
);

/**
 * TrendDashboard
 * ----------------
 * Recharts-based analytics view.
 * Displays:
 *   - Bar chart of risk distribution
 *   - Most common scam category
 *   - Most common psychological trigger
 *
 * Props:
 *   trends: {
 *     risk_distribution: { Low, Medium, High, Critical },
 *     most_common_scam_category: string,
 *     most_common_psych_trigger: string,
 *   }
 */

const RISK_COLORS = {
  Low: "#22C55E",
  Medium: "#EAB308",
  High: "#F97316",
  Critical: "#EF4444",
};

// Custom tooltip for the bar chart
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-suraksha-dark border border-suraksha-border rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs font-semibold" style={{ color: RISK_COLORS[label] }}>
        {label}
      </p>
      <p className="text-xs text-gray-300">
        {payload[0].value} analyses
      </p>
    </div>
  );
}

export default function TrendDashboard({ trends }) {
  if (!trends) return null;

  const { risk_distribution, most_common_scam_category, most_common_psych_trigger } =
    trends;

  // Transform risk_distribution into Recharts data
  const chartData = Object.entries(risk_distribution).map(([level, count]) => ({
    name: level,
    count,
  }));

  const total = Object.values(risk_distribution).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total analyses */}
        <div className="bg-suraksha-card border border-suraksha-border rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
            Total Analyses
          </p>
          <p className="text-3xl font-bold text-white">{total}</p>
        </div>

        {/* Most common scam category */}
        <div className="bg-suraksha-card border border-suraksha-border rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
            Top Scam Category
          </p>
          <p className="text-lg font-semibold text-red-400">
            {most_common_scam_category || "N/A"}
          </p>
        </div>

        {/* Most common psychological trigger */}
        <div className="bg-suraksha-card border border-suraksha-border rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
            Top Psych Trigger
          </p>
          <p className="text-lg font-semibold text-purple-400">
            {most_common_psych_trigger || "N/A"}
          </p>
        </div>
      </div>

      {/* Bar chart */}
      <div className="bg-suraksha-card border border-suraksha-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-6">
          Risk Distribution
        </h3>

        {total === 0 ? (
          <p className="text-sm text-gray-500 text-center py-10">
            No analyses recorded yet. Analyze some messages first!
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="name"
                tick={{ fill: "#9CA3AF", fontSize: 12 }}
                axisLine={{ stroke: "#334155" }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "#9CA3AF", fontSize: 12 }}
                axisLine={{ stroke: "#334155" }}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {chartData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={RISK_COLORS[entry.name] || "#6B7280"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Per-level breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(risk_distribution).map(([level, count]) => {
          const pct = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
          return (
            <div
              key={level}
              className="bg-suraksha-card border border-suraksha-border rounded-xl p-4 text-center"
            >
              <div
                className="text-2xl font-bold"
                style={{ color: RISK_COLORS[level] }}
              >
                {count}
              </div>
              <div className="text-xs text-gray-500 mt-1">{level}</div>
              <div className="text-[10px] text-gray-600">{pct}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}