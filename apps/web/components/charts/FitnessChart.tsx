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
import * as c from "@/styles/chartCard.css";

interface FitnessPoint {
  date: string;
  ctl: number;
  atl: number;
  tsb: number;
}

export function FitnessChart({ data }: { data: FitnessPoint[] }) {
  // Show last 60 data points for readability
  const displayData = data.slice(-60);

  return (
    <div className={c.root}>
      <div className={c.kicker}>Forma deportiva</div>
      <div className={c.titleMb4}>CTL · ATL · TSB</div>
      <div className={c.chartCaption}>Fitness · Fatiga · Forma</div>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={displayData}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.04)"
          />
          <XAxis
            dataKey="date"
            tick={{ fill: "#475569", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: string) => v.slice(5)} // Show MM-DD
          />
          <YAxis
            tick={{ fill: "#475569", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="ctl"
            name="Fitness"
            stroke="#4ade80"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="atl"
            name="Fatiga"
            stroke="#f87171"
            strokeWidth={2}
            dot={false}
            strokeDasharray="4 2"
          />
          <Line
            type="monotone"
            dataKey="tsb"
            name="Forma"
            stroke="#e879f9"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#e879f9" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
