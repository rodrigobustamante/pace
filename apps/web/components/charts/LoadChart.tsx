"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { CustomTooltip } from "@/components/CustomTooltip";

interface WeeklyData {
  week: string;
  tss: number;
}

export function LoadChart({ data }: { data: WeeklyData[] }) {
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
        Carga de entrenamiento
      </div>
      <div
        style={{
          fontSize: 24,
          fontWeight: 800,
          fontFamily: "'Barlow Condensed', sans-serif",
          marginBottom: 16,
        }}
      >
        TSS <span style={{ color: "#fb923c" }}>progresivo</span>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data}>
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
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="tss"
            name="Carga"
            fill="#f97316"
            fillOpacity={0.7}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
