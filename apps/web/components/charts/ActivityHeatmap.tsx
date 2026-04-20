"use client";

import { useQuery } from "@tanstack/react-query";
import * as mx from "@/styles/metricsExtra.css";

interface HeatmapDay {
  date: string;
  km: number;
  tss: number;
  count: number;
}

interface HeatmapResponse {
  days: HeatmapDay[];
  maxKm: number;
  maxTSS: number;
}

const MONTH_NAMES = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

const DAY_LABELS = ["", "Lun", "", "Mié", "", "Vie", ""];

function getCellColor(km: number, maxKm: number): string {
  if (km <= 0 || maxKm <= 0) return "rgba(255,255,255,0.04)";
  const ratio = km / maxKm;
  if (ratio <= 0.25) return "rgba(249,115,22,0.25)";
  if (ratio <= 0.5) return "rgba(249,115,22,0.5)";
  if (ratio <= 0.75) return "rgba(249,115,22,0.75)";
  return "rgba(249,115,22,1)";
}

/** Returns the Monday of the week containing the given date */
function getMondayOf(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon, ...
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function buildGrid(days: HeatmapDay[]): {
  weeks: Array<Array<{ date: string; km: number; label: string } | null>>;
  monthLabels: Array<{ label: string; col: number }>;
} {
  const dayMap = new Map<string, HeatmapDay>();
  for (const d of days) {
    dayMap.set(d.date, d);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Start 52 weeks ago on Monday
  const startMonday = getMondayOf(today);
  startMonday.setDate(startMonday.getDate() - 52 * 7);

  const weeks: Array<Array<{ date: string; km: number; label: string } | null>> =
    [];
  const monthLabels: Array<{ label: string; col: number }> = [];
  const seenMonths = new Set<string>();

  const cursor = new Date(startMonday);

  for (let w = 0; w < 53; w++) {
    const week: Array<{ date: string; km: number; label: string } | null> = [];

    for (let d = 0; d < 7; d++) {
      const isoDate = toISODate(cursor);
      const activity = dayMap.get(isoDate);
      const km = activity?.km ?? 0;

      if (cursor <= today) {
        week.push({
          date: isoDate,
          km,
          label: `${isoDate}: ${km > 0 ? km.toFixed(1) + " km" : "sin actividad"}`,
        });
      } else {
        week.push(null);
      }

      // Track month label for the first day of each month seen in row 0 (Monday)
      if (d === 0) {
        const monthKey = `${cursor.getFullYear()}-${cursor.getMonth()}`;
        if (!seenMonths.has(monthKey)) {
          seenMonths.add(monthKey);
          monthLabels.push({
            label: MONTH_NAMES[cursor.getMonth()],
            col: w,
          });
        }
      }

      cursor.setDate(cursor.getDate() + 1);
    }

    weeks.push(week);
  }

  return { weeks, monthLabels };
}

const LEGEND_COLORS = [
  "rgba(255,255,255,0.04)",
  "rgba(249,115,22,0.25)",
  "rgba(249,115,22,0.5)",
  "rgba(249,115,22,0.75)",
  "rgba(249,115,22,1)",
];

export function ActivityHeatmap() {
  const { data, isLoading } = useQuery<HeatmapResponse>({
    queryKey: ["metrics-heatmap"],
    queryFn: () => fetch("/api/metrics/heatmap").then((r) => r.json()),
  });

  if (isLoading || !data) {
    return (
      <div className={mx.heatmapSection}>
        <div
          style={{
            color: "#475569",
            fontSize: 12,
            fontFamily: "var(--font-dm-mono, 'DM Mono', monospace)",
          }}
        >
          cargando...
        </div>
      </div>
    );
  }

  const { weeks, monthLabels } = buildGrid(data.days);

  return (
    <div className={mx.heatmapSection}>
      {/* Month labels row */}
      <div style={{ display: "flex", marginBottom: 4, marginLeft: 28 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(53, 15px)",
            gap: 3,
            position: "relative",
            width: "100%",
          }}
        >
          {monthLabels.map(({ label, col }) => (
            <div
              key={`${label}-${col}`}
              className={mx.heatmapMonthLabel}
              style={{ gridColumn: col + 1 }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Grid with day labels */}
      <div className={mx.heatmapWrap}>
        {/* Day labels column */}
        <div className={mx.heatmapDayLabels}>
          {DAY_LABELS.map((label, i) => (
            <div key={i} style={{ height: 12, lineHeight: "12px" }}>
              {label}
            </div>
          ))}
        </div>

        {/* Main heatmap grid — columns are weeks, rows are days */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(53, 15px)",
            gridTemplateRows: "repeat(7, 15px)",
            gridAutoFlow: "column",
            gap: 3,
          }}
        >
          {weeks.map((week, wIdx) =>
            week.map((cell, dIdx) => {
              if (!cell) {
                return (
                  <div
                    key={`${wIdx}-${dIdx}`}
                    className={mx.heatmapCell}
                    style={{ background: "transparent" }}
                  />
                );
              }
              return (
                <div
                  key={`${wIdx}-${dIdx}`}
                  className={mx.heatmapCell}
                  title={cell.label}
                  style={{
                    background: getCellColor(cell.km, data.maxKm),
                  }}
                />
              );
            })
          )}
        </div>
      </div>

      {/* Legend */}
      <div className={mx.heatmapLegend}>
        <span>Menos</span>
        {LEGEND_COLORS.map((color) => (
          <div
            key={color}
            className={mx.heatmapLegendCell}
            style={{ background: color }}
          />
        ))}
        <span>Más</span>
      </div>
    </div>
  );
}
