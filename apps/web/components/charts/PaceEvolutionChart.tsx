"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { CustomTooltip } from "@/components/CustomTooltip";
import { secToPace } from "@pace/utils";

interface WeeklyData {
  week: string;
  avgPace: number;
}

export function PaceEvolutionChart({ data }: { data: WeeklyData[] }) {
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
          fontSize: 11,
          fontWeight: 600,
          color: "#94a3b8",
          marginBottom: 4,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        Evolución de Pace
      </div>
      <div
        style={{
          fontSize: 24,
          fontWeight: 800,
          fontFamily: "'Barlow Condensed', sans-serif",
          marginBottom: 16,
        }}
      >
        <span style={{ color: "#4ade80" }}>Tendencia</span>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.04)"
          />
          <XAxis
            dataKey="week"
            tick={{ fill: "#475569", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#475569", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => secToPace(v)}
          />
          <Tooltip
            content={<CustomTooltip formatter={(v) => secToPace(Number(v))} />}
          />
          <Line
            type="monotone"
            dataKey="avgPace"
            name="Pace prom"
            stroke="#60a5fa"
            strokeWidth={2.5}
            dot={{ fill: "#60a5fa", r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
