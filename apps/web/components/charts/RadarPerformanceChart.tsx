"use client";

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import { useTranslations } from "next-intl";
import * as c from "@/styles/chartCard.css";

interface RadarData {
  metric: string;
  value: number;
}

const RADAR_BODY_KEYS = [
  "radarVolumeBody",
  "radarConsistencyBody",
  "radarIntensityBody",
  "radarRecoveryBody",
  "radarCadenceBody",
  "radarEconomyBody",
] as const;

const RADAR_NAME_KEYS = [
  "volume",
  "consistency",
  "intensity",
  "recovery",
  "cadence",
  "economy",
] as const;

export function RadarPerformanceChart({ data }: { data: RadarData[] }) {
  const tChart = useTranslations("charts");
  const tDash = useTranslations("dashboard");

  return (
    <div className={c.root}>
      <div className={c.kicker}>{tChart("athleticProfile")}</div>
      <div className={c.titleMb8}>{tChart("balance")}</div>
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

      <div className={c.radarLegend}>
        <div className={c.radarLegendTitle}>{tChart("radarLegendTitle")}</div>
        <ul className={c.radarLegendList}>
          {RADAR_BODY_KEYS.map((bodyKey, i) => {
            const nameKey = RADAR_NAME_KEYS[i]!;
            return (
              <li key={bodyKey} className={c.radarLegendItem}>
                <span className={c.radarLegendName}>
                  {tDash(`radar.${nameKey}`)}:
                </span>
                {tChart(bodyKey)}
              </li>
            );
          })}
        </ul>
        <p className={c.radarLegendFoot}>{tChart("radarLegendFoot")}</p>
      </div>
    </div>
  );
}
