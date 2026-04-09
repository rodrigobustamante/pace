"use client";

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";

interface RadarData {
  metric: string;
  value: number;
}

export function RadarPerformanceChart({ data }: { data: RadarData[] }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 16,
        padding: 24,
      }}
    >
      <div
        style={{
          fontSize: 12,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "#64748b",
          marginBottom: 4,
          fontFamily: "'DM Mono', monospace",
        }}
      >
        Perfil atlético
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          fontFamily: "'Barlow Condensed', sans-serif",
          marginBottom: 8,
        }}
      >
        Balance
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <RadarChart data={data}>
          <PolarGrid stroke="rgba(255,255,255,0.08)" />
          <PolarAngleAxis
            dataKey="metric"
            tick={{ fill: "#475569", fontSize: 10 }}
          />
          <Radar
            dataKey="value"
            stroke="#fb923c"
            fill="#fb923c"
            fillOpacity={0.15}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
