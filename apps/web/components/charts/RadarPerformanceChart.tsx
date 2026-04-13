"use client";

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import * as c from "@/styles/chartCard.css";

interface RadarData {
  metric: string;
  value: number;
}

export function RadarPerformanceChart({ data }: { data: RadarData[] }) {
  return (
    <div className={c.root}>
      <div className={c.kicker}>Perfil atlético</div>
      <div className={c.titleMb8}>Balance</div>
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
