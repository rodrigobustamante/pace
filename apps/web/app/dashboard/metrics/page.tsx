"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { PaceEvolutionChart } from "@/components/charts/PaceEvolutionChart";
import { HREvolutionChart } from "@/components/charts/HREvolutionChart";
import { LoadChart } from "@/components/charts/LoadChart";
import { ActivityHeatmap } from "@/components/charts/ActivityHeatmap";
import { PRDisplay } from "@/components/PRDisplay";
import { SkeletonCard } from "@/components/SkeletonCard";
import * as grid from "@/styles/dashboardGrid.css";
import * as s from "@/styles/pagesShared.css";
import * as mx from "@/styles/metricsExtra.css";

interface WeeklyDataPoint {
  week: string;
  km: number;
  tss: number;
  avgPace: number;
  avgHR: number;
  sessions: number;
}

interface AnnualStats {
  totalKm: number;
  totalRuns: number;
  activeDays: number;
  totalElevationM: number;
  avgWeeklyKm: number;
}

interface Streaks {
  currentStreak: number;
  longestStreak: number;
}

interface MetricsResponse {
  weeklyData: WeeklyDataPoint[];
  annualStats?: AnnualStats;
  streaks?: Streaks;
}

interface PredictionsResponse {
  predictions: Array<{
    distance: string;
    distanceM: number;
    predictedTimeSec: number;
    predictedTimeFormatted: string;
  }>;
}

function formatElevation(m: number): string {
  if (m > 1000) return `${(m / 1000).toFixed(1)}k m`;
  return `${Math.round(m)} m`;
}

export default function MetricsPage() {
  const t = useTranslations("metrics");
  const { data: metrics, isLoading } = useQuery<MetricsResponse>({
    queryKey: ["metrics"],
    queryFn: () => fetch("/api/metrics").then((r) => r.json()),
  });

  const { data: predictions, isLoading: loadingPred } =
    useQuery<PredictionsResponse>({
      queryKey: ["predictions"],
      queryFn: () => fetch("/api/metrics/predictions").then((r) => r.json()),
    });

  const weeklyData = metrics?.weeklyData ?? [];
  const totalWeeks = weeklyData.length;
  const firstWeek = weeklyData[0]?.week ?? "";
  const lastWeek = weeklyData[weeklyData.length - 1]?.week ?? "";
  const annualStats = metrics?.annualStats;
  const streaks = metrics?.streaks;

  return (
    <div>
      <div className={s.pageHeaderBlock}>
        <div className={s.pageTitle}>{t("title")}</div>
        <div className={s.pageSubtitle}>
          {totalWeeks > 0
            ? t("subtitleLoaded", { weeks: totalWeeks, first: firstWeek, last: lastWeek })
            : t("subtitleLoading")}
        </div>
      </div>

      {/* ── Año en números ───────────────────────────────────────────────── */}
      <div className={mx.sectionBlock}>
        <div className={s.sectionLabel}>{t("annual.label")}</div>
        <div className={mx.sectionHeading}>{t("annual.heading")}</div>

        {isLoading || !annualStats ? (
          <>
            <div className={mx.annualGrid}>
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonCard key={i} height={80} />
              ))}
            </div>
            <div className={mx.streakRow}>
              <SkeletonCard height={100} />
              <SkeletonCard height={100} />
            </div>
          </>
        ) : (
          <>
            <div className={mx.annualGrid}>
              <div className={mx.annualStat}>
                <div className={mx.annualValue}>
                  {annualStats.totalKm.toFixed(0)}
                </div>
                <div className={mx.annualLabel}>{t("annual.totalKm")}</div>
              </div>
              <div className={mx.annualStat}>
                <div className={mx.annualValue}>{annualStats.totalRuns}</div>
                <div className={mx.annualLabel}>{t("annual.runs")}</div>
              </div>
              <div className={mx.annualStat}>
                <div className={mx.annualValue}>{annualStats.activeDays}</div>
                <div className={mx.annualLabel}>{t("annual.activeDays")}</div>
              </div>
              <div className={mx.annualStat}>
                <div className={mx.annualValue}>
                  {formatElevation(annualStats.totalElevationM)}
                </div>
                <div className={mx.annualLabel}>{t("annual.elevation")}</div>
              </div>
              <div className={`${mx.annualStat} ${mx.annualStatLast}`}>
                <div className={mx.annualValue}>
                  {annualStats.avgWeeklyKm.toFixed(1)}
                </div>
                <div className={mx.annualLabel}>{t("annual.weeklyKm")}</div>
              </div>
            </div>

            {streaks && (
              <div className={mx.streakRow}>
                <div className={mx.streakCard}>
                  <div className={mx.streakFire}>🔥</div>
                  <div className={mx.streakNumber}>{streaks.currentStreak}</div>
                  <div className={mx.streakLabel}>{t("annual.currentStreak")}</div>
                </div>
                <div className={mx.streakCard}>
                  <div className={mx.streakFire}>⚡</div>
                  <div className={mx.streakNumber}>{streaks.longestStreak}</div>
                  <div className={mx.streakLabel}>{t("annual.bestStreak")}</div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Personal Records ─────────────────────────────────────────────── */}
      <div className={mx.sectionBlock}>
        <div className={s.sectionLabel}>{t("prs.label")}</div>
        <div className={mx.sectionHeading}>{t("prs.heading")}</div>
        <div className={mx.sectionSub}>{t("prs.sub")}</div>
        <PRDisplay />
      </div>

      {/* ── Actividad del año ────────────────────────────────────────────── */}
      <div className={mx.sectionBlock}>
        <div className={s.sectionLabel}>{t("heatmap.label")}</div>
        <div className={mx.sectionHeading}>{t("heatmap.heading")}</div>
        <div className={mx.sectionSub}>{t("heatmap.sub")}</div>
        <ActivityHeatmap />
      </div>

      {/* ── Existing charts grid ─────────────────────────────────────────── */}
      {isLoading || loadingPred ? (
        <div className={grid.rg2}>
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} height={260} />
          ))}
        </div>
      ) : (
        <div className={grid.rg2}>
          <PaceEvolutionChart data={weeklyData} />
          <HREvolutionChart data={weeklyData} />
          <LoadChart data={weeklyData} />

          <div className={s.cardSubtle}>
            <div className={s.sectionLabel}>{t("predictor.label")}</div>
            <div className={s.sectionTitleSm}>{t("predictor.heading")}</div>
            {predictions?.predictions.length === 0 && (
              <div className={s.mutedText13}>{t("predictor.empty")}</div>
            )}
            {predictions?.predictions.map((pred) => (
              <div key={pred.distance} className={s.predictionRow}>
                <div className={s.predictionLeft}>
                  <div className={s.predictionBadge}>{pred.distance}</div>
                  <div className={s.predictionHint}>{t("predictor.projected")}</div>
                </div>
                <div className={s.predictionTime}>
                  {pred.predictedTimeFormatted}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
