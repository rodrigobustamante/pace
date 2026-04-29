"use client";

import { useTranslations } from "next-intl";
import * as hz from "@/styles/hrZonesChart.css";

const zoneColors = ["#334155", "#3b82f6", "#22d3ee", "#f97316", "#ef4444"];
const zoneThresholds = [0, 0.6, 0.7, 0.8, 0.9, 1];

interface ZoneDistribution {
  z1: number;
  z2: number;
  z3: number;
  z4: number;
  z5: number;
}

function zoneRange(index: number, maxHR: number): string {
  const lo = Math.round(maxHR * zoneThresholds[index]!);
  const hi = Math.round(maxHR * zoneThresholds[index + 1]!) - 1;
  if (index === 0) return `< ${Math.round(maxHR * 0.6)} bpm`;
  if (index === 4) return `≥ ${Math.round(maxHR * 0.9)} bpm`;
  return `${lo}–${hi} bpm`;
}

export function HRZonesChart({
  zones,
  maxHR,
}: {
  zones: ZoneDistribution;
  maxHR?: number | null;
}) {
  const t = useTranslations("charts");
  const zoneLabels = t.raw("zoneStyles") as string[];
  const values = [zones.z1, zones.z2, zones.z3, zones.z4, zones.z5];
  const total = values.reduce((s, v) => s + v, 0);

  return (
    <div className={hz.root}>
      <div className={hz.kicker}>{t("hrDistribution")}</div>
      <div className={hz.title}>{t("zones")}</div>
      {values.map((minutes, i) => {
        const pct = total > 0 ? Math.round((minutes / total) * 100) : 0;
        return (
          <div key={i} className={hz.zoneBlock}>
            <div className={hz.zoneHeader}>
              <div className={hz.zoneLeft}>
                <span className={hz.zoneName}>
                  Z{i + 1}{" "}
                  <span className={hz.zoneNameMuted}>
                    · {zoneLabels[i] ?? ""}
                  </span>
                </span>
                {maxHR ? (
                  <span className={hz.zoneBpm}>{zoneRange(i, maxHR)}</span>
                ) : null}
              </div>
              <span className={hz.zoneMeta}>
                {Math.round(minutes)}min{" "}
                <span className={hz.zoneMetaPct}>({pct}%)</span>
              </span>
            </div>
            <div className={hz.barTrack}>
              <div
                className={hz.barFill}
                style={{
                  width: `${pct}%`,
                  background: zoneColors[i] ?? "#fb923c",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
