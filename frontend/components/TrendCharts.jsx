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

const RISK_COLORS = {
  Low: "#10B981",
  Medium: "#F59E0B",
  High: "#F97316",
  Critical: "#EF4444",
};

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-sb-card border border-sb-border rounded-xl px-3 py-2 shadow-xl">
      <p
        className="text-xs font-semibold"
        style={{ color: RISK_COLORS[label] }}
      >
        {label}
      </p>
      <p className="text-xs text-sb-textSecondary">
        {payload[0].value} analyses
      </p>
    </div>
  );
}

export default function TrendCharts({ trends }) {
  if (!trends) return null;

  const { risk_distribution } = trends;
  const chartData = Object.entries(risk_distribution).map(([level, count]) => ({
    name: level,
    count,
  }));
  const total = Object.values(risk_distribution).reduce((a, b) => a + b, 0);

  return (
    <div className="bg-sb-card border border-sb-border rounded-2xl p-5 animate-fade-in">
      <h3 className="text-xs font-semibold text-sb-textSecondary uppercase tracking-wider mb-6">
        Risk Distribution
      </h3>

      {total === 0 ? (
        <p className="text-sm text-sb-textMuted text-center py-10">
          No analyses recorded yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} barCategoryGap="30%">
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1F2937"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fill: "#6B7280", fontSize: 11 }}
                axisLine={{ stroke: "#1F2937" }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "#6B7280", fontSize: 11 }}
                axisLine={{ stroke: "#1F2937" }}
                tickLine={false}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "rgba(255,255,255,0.02)" }}
              />
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
        </div>
      )}
    </div>
  );
}