"use client";

import { useTranslations } from "next-intl";
import {
  AreaChart,
  Area,
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
  avgHR: number;
}

export function HREvolutionChart({ data }: { data: WeeklyData[] }) {
  const t = useTranslations("charts");

  return (
    <div className={c.root}>
      <div className={c.kickerAlt}>{t("avgHRTitle")}</div>
      <div className={c.titleLg}>
        {t("hrRhythm")}{" "}
        <span className={c.accentGreen}>{t("hrStableAccent")}</span>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="hrGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4ade80" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
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
            dataKey="avgHR"
            name={t("avgHRSeries")}
            stroke="#4ade80"
            fill="url(#hrGrad)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
