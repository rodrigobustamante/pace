"use client";

import { useState } from "react";
import { secToPace, secToDuration, mToKm } from "@pace/utils";

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

const typeConfig: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  easy: { label: "Fácil", color: "#4ade80", bg: "rgba(74,222,128,0.12)" },
  tempo: { label: "Tempo", color: "#fb923c", bg: "rgba(251,146,60,0.12)" },
  long: {
    label: "Long Run",
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.12)",
  },
  workout: {
    label: "Workout",
    color: "#f472b6",
    bg: "rgba(244,114,182,0.12)",
  },
  race: {
    label: "Carrera",
    color: "#facc15",
    bg: "rgba(250,204,21,0.12)",
  },
  unknown: { label: "Run", color: "#94a3b8", bg: "rgba(148,163,184,0.12)" },
};

interface ActivityRowProps {
  activity: Activity;
}

export function ActivityRow({ activity: act }: ActivityRowProps) {
  const [expanded, setExpanded] = useState(false);
  const cfg = typeConfig[act.type] ?? typeConfig.unknown!;

  const dateStr =
    act.date instanceof Date
      ? act.date.toLocaleDateString("es", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : new Date(act.date).toLocaleDateString("es", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });

  return (
    <div
      className="activity-row"
      onClick={() => setExpanded(!expanded)}
      style={{
        background: expanded
          ? "rgba(255,255,255,0.06)"
          : "rgba(255,255,255,0.02)",
        border: `1px solid ${expanded ? "rgba(249,115,22,0.3)" : "rgba(255,255,255,0.06)"}`,
        borderRadius: 12,
        padding: "16px 20px",
        transition: "all 0.15s",
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: cfg.bg,
            border: `1px solid ${cfg.color}30`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            flexShrink: 0,
          }}
        >
          🏃
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 2,
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600, color: "#f1f5f9" }}>
              {act.name}
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: 20,
                background: cfg.bg,
                color: cfg.color,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              {cfg.label}
            </span>
          </div>
          <div style={{ fontSize: 11, color: "#475569" }}>{dateStr}</div>
        </div>
        {/* Desktop: all 4 stats */}
        <div className="act-stats-full" style={{ display: "flex", gap: 32, textAlign: "right" }}>
          {[
            { v: `${mToKm(act.distanceM)} km`, l: "Distancia" },
            { v: secToPace(act.paceSeckm) + "/km", l: "Pace" },
            {
              v: act.avgHRbpm ? `${act.avgHRbpm} bpm` : "—",
              l: "FC prom",
            },
            {
              v: act.cadenceRpm ? `${act.cadenceRpm} ppm` : "—",
              l: "Cadencia",
            },
          ].map((m) => (
            <div key={m.l} style={{ minWidth: 70 }}>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  fontFamily: "'Barlow Condensed', sans-serif",
                  color: "#f1f5f9",
                }}
              >
                {m.v}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "#475569",
                  letterSpacing: "0.06em",
                }}
              >
                {m.l}
              </div>
            </div>
          ))}
          {act.feel != null && (
            <div style={{ minWidth: 50 }}>
              <div style={{ display: "flex", gap: 2 }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <div
                    key={s}
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 2,
                      background:
                        s <= (act.feel ?? 0)
                          ? "#fb923c"
                          : "rgba(255,255,255,0.1)",
                    }}
                  />
                ))}
              </div>
              <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>
                Sensación
              </div>
            </div>
          )}
        </div>

        {/* Mobile: distance + pace only */}
        <div className="act-stats-mini" style={{ textAlign: "right", gap: 16 }}>
          {[
            { v: `${mToKm(act.distanceM)} km`, l: "Dist" },
            { v: secToPace(act.paceSeckm), l: "Pace" },
          ].map((m) => (
            <div key={m.l}>
              <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", color: "#f1f5f9" }}>
                {m.v}
              </div>
              <div style={{ fontSize: 10, color: "#475569" }}>{m.l}</div>
            </div>
          ))}
        </div>
      </div>

      {expanded && (
        <div
          style={{
            marginTop: 16,
            paddingTop: 16,
            borderTop: "1px solid rgba(255,255,255,0.06)",
            display: "grid",
            gap: 12,
          }}
          className="act-expand-grid"
        >
          {[
            { l: "Duración", v: secToDuration(act.durationSec) },
            {
              l: "Elevación",
              v: act.elevationM != null ? `+${Math.round(act.elevationM)}m` : "—",
            },
            {
              l: "Calorías",
              v: act.caloriesKcal ? `${act.caloriesKcal} kcal` : "—",
            },
            {
              l: "FC máx",
              v: act.maxHRbpm ? `${act.maxHRbpm} bpm` : "—",
            },
          ].map((m) => (
            <div
              key={m.l}
              style={{
                background: "rgba(255,255,255,0.03)",
                borderRadius: 8,
                padding: "10px 14px",
              }}
            >
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  fontFamily: "'Barlow Condensed', sans-serif",
                }}
              >
                {m.v}
              </div>
              <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>
                {m.l}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
