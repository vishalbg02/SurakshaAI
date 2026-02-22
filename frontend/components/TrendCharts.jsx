"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";

const COLORS = { Low: "#10B981", Medium: "#F59E0B", High: "#F97316", Critical: "#EF4444" };

function Tip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-cx-card border border-cx-border rounded-xl px-3 py-2 shadow-2xl">
      <p className="text-[11px] font-semibold" style={{ color: COLORS[label] }}>{label}</p>
      <p className="text-[10px] text-cx-textDim">{payload[0].value} analyses</p>
    </div>
  );
}

export default function TrendCharts({ trends }) {
  if (!trends) return null;
  const data = Object.entries(trends.risk_distribution).map(([name, count]) => ({ name, count }));
  const total = Object.values(trends.risk_distribution).reduce((a, b) => a + b, 0);

  return (
    <div className="bg-cx-card border border-cx-border rounded-2xl p-5 animate-fade-in">
      <h3 className="text-[10px] font-semibold text-cx-textDim uppercase tracking-wider mb-6">Risk Distribution</h3>
      {total === 0 ? (
        <p className="text-sm text-cx-textDim text-center py-10">No data yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={{ stroke: "#1E293B" }} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: "#64748B", fontSize: 10 }} axisLine={{ stroke: "#1E293B" }} tickLine={false} />
              <Tooltip content={<Tip />} cursor={{ fill: "rgba(255,255,255,0.015)" }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} animationDuration={1200} animationEasing="ease-out">
                {data.map((e) => <Cell key={e.name} fill={COLORS[e.name] || "#64748B"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}