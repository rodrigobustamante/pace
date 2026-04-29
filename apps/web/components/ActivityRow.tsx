"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { secToPace, secToDuration, mToKm } from "@pace/utils";
import * as styles from "@/styles/activityRow.css";
import * as grid from "@/styles/dashboardGrid.css";

interface Activity {
  id: string;
  name: string;
  type: string;
  date: string | Date;
  distanceM: number;
  durationSec: number;
  paceSeckm: number;
  avgHRbpm: number | null;
  maxHRbpm: number | null;
  cadenceRpm: number | null;
  elevationM: number | null;
  caloriesKcal: number | null;
  feel: number | null;
}

const typeColors: Record<string, { color: string; bg: string }> = {
  easy:    { color: "#4ade80", bg: "rgba(74,222,128,0.12)" },
  tempo:   { color: "#fb923c", bg: "rgba(251,146,60,0.12)" },
  long:    { color: "#60a5fa", bg: "rgba(96,165,250,0.12)" },
  workout: { color: "#f472b6", bg: "rgba(244,114,182,0.12)" },
  race:    { color: "#facc15", bg: "rgba(250,204,21,0.12)" },
  unknown: { color: "#94a3b8", bg: "rgba(148,163,184,0.12)" },
};

interface ActivityRowProps {
  activity: Activity;
}

export function ActivityRow({ activity: act }: ActivityRowProps) {
  const [expanded, setExpanded] = useState(false);
  const t = useTranslations("activities");
  const locale = useLocale();
  const colors = typeColors[act.type] ?? typeColors.unknown!;
  const typeLabel = t(`types.${act.type}` as Parameters<typeof t>[0]) ?? act.type;

  const dateStr = new Date(act.date).toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div
      className={styles.row}
      data-expanded={expanded ? "true" : "false"}
      onClick={() => setExpanded(!expanded)}
    >
      <div className={styles.rowInner}>
        <div
          className={styles.typeIcon}
          style={{
            background: colors.bg,
            border: `1px solid ${colors.color}30`,
          }}
        >
          🏃
        </div>
        <div className={styles.mainCol}>
          <div className={styles.titleRow}>
            <span className={styles.title}>{act.name}</span>
            <span
              className={styles.typeBadge}
              style={{ background: colors.bg, color: colors.color }}
            >
              {typeLabel}
            </span>
          </div>
          <div className={styles.dateLine}>{dateStr}</div>
        </div>
        <div className={grid.actStatsFull}>
          {[
            { v: `${mToKm(act.distanceM)} km`, l: t("stats.distance") },
            { v: secToPace(act.paceSeckm) + "/km", l: "Pace" },
            { v: act.avgHRbpm ? `${act.avgHRbpm} bpm` : "—", l: t("stats.hrAvg") },
            { v: act.cadenceRpm ? `${act.cadenceRpm} ppm` : "—", l: t("stats.cadence") },
          ].map((m) => (
            <div key={m.l} className={styles.statCol}>
              <div className={styles.statValue}>{m.v}</div>
              <div className={styles.statLabel}>{m.l}</div>
            </div>
          ))}
          {act.feel != null && (
            <div style={{ minWidth: 50 }}>
              <div className={styles.feelDots}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <div
                    key={s}
                    className={styles.feelDot}
                    style={{
                      background:
                        s <= (act.feel ?? 0)
                          ? "#fb923c"
                          : "rgba(255,255,255,0.1)",
                    }}
                  />
                ))}
              </div>
              <div className={styles.feelLabel}>{t("stats.feel")}</div>
            </div>
          )}
        </div>

        <div className={grid.actStatsMini}>
          {[
            { v: `${mToKm(act.distanceM)} km`, l: "Dist" },
            { v: secToPace(act.paceSeckm), l: "Pace" },
          ].map((m) => (
            <div key={m.l}>
              <div className={styles.statValueSm}>{m.v}</div>
              <div className={styles.statLabel}>{m.l}</div>
            </div>
          ))}
        </div>
      </div>

      {expanded && (
        <div className={`${styles.expandSection} ${grid.actExpandGrid}`}>
          {[
            { l: t("stats.duration"), v: secToDuration(act.durationSec) },
            { l: t("stats.elevation"), v: act.elevationM != null ? `+${Math.round(act.elevationM)}m` : "—" },
            { l: t("stats.calories"), v: act.caloriesKcal ? `${act.caloriesKcal} kcal` : "—" },
            { l: t("stats.hrMax"), v: act.maxHRbpm ? `${act.maxHRbpm} bpm` : "—" },
          ].map((m) => (
            <div key={m.l} className={styles.expandCell}>
              <div className={styles.expandValue}>{m.v}</div>
              <div className={styles.expandLabel}>{m.l}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
