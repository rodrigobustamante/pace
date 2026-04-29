"use client";

import { useTranslations } from "next-intl";
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
import * as c from "@/styles/chartCard.css";

interface WeeklyData {
  week: string;
  avgPace: number;
}

export function PaceEvolutionChart({ data }: { data: WeeklyData[] }) {
  const t = useTranslations("charts");

  return (
    <div className={c.root}>
      <div className={c.kickerAlt}>{t("paceEvolution")}</div>
      <div className={c.titleLg}>
        <span className={c.accentGreen}>{t("paceTrend")}</span>
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
            name={t("avgPaceSeries")}
            stroke="#60a5fa"
            strokeWidth={2.5}
            dot={{ fill: "#60a5fa", r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
