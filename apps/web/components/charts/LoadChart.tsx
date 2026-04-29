"use client";

import { useTranslations } from "next-intl";
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
import * as c from "@/styles/chartCard.css";

interface WeeklyData {
  week: string;
  tss: number;
}

export function LoadChart({ data }: { data: WeeklyData[] }) {
  const t = useTranslations("charts");

  return (
    <div className={c.root}>
      <div className={c.kickerAlt}>{t("trainingLoad")}</div>
      <div className={c.titleLg}>
        {t("tssStackTitle")}{" "}
        <span className={c.accentOrange}>{t("tssProgressiveAccent")}</span>
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
            name={t("seriesLoad")}
            fill="#f97316"
            fillOpacity={0.7}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
