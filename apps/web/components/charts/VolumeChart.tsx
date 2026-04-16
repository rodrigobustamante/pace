"use client";

import {
  AreaChart,
  Area,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { CustomTooltip } from "@/components/CustomTooltip";
import * as c from "@/styles/chartCard.css";

interface WeeklyData {
  week: string;
  km: number;
  tss?: number;
}

export function VolumeChart({ data }: { data: WeeklyData[] }) {
  return (
    <div className={c.root}>
      <div className={c.kicker}>Volumen semanal</div>
      <div className={c.title}>
        km <span className={c.accentOrange}>↑ tendencia</span>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="kmGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
            </linearGradient>
          </defs>
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
          <Area
            type="monotone"
            dataKey="km"
            name="km"
            stroke="#f97316"
            strokeWidth={2.5}
            fill="url(#kmGrad)"
            dot={{ fill: "#f97316", r: 3 }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className={c.stackedChartBlock}>
        <div className={c.kicker}>Carga semanal</div>
        <div className={c.stackedChartTitle}>
          TSS <span className={c.stackedChartAccentBlue}>· estrés acumulado</span>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="tssBarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.95} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.55} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.04)"
              vertical={false}
            />
            <XAxis
              dataKey="week"
              tick={{ fill: "#475569", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#475569", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="tss"
              name="TSS"
              fill="url(#tssBarGrad)"
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
