"use client";

import { useQuery } from "@tanstack/react-query";
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
        <div className={s.pageTitle}>Métricas de evolución</div>
        <div className={s.pageSubtitle}>
          {totalWeeks > 0
            ? `${totalWeeks} semanas · ${firstWeek} → ${lastWeek}`
            : "Cargando datos..."}
        </div>
      </div>

      {/* ── Año en números ───────────────────────────────────────────────── */}
      <div className={mx.sectionBlock}>
        <div className={s.sectionLabel}>Resumen anual</div>
        <div className={mx.sectionHeading}>Año en números</div>

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
                <div className={mx.annualLabel}>km totales</div>
              </div>
              <div className={mx.annualStat}>
                <div className={mx.annualValue}>{annualStats.totalRuns}</div>
                <div className={mx.annualLabel}>salidas</div>
              </div>
              <div className={mx.annualStat}>
                <div className={mx.annualValue}>{annualStats.activeDays}</div>
                <div className={mx.annualLabel}>días activos</div>
              </div>
              <div className={mx.annualStat}>
                <div className={mx.annualValue}>
                  {formatElevation(annualStats.totalElevationM)}
                </div>
                <div className={mx.annualLabel}>desnivel</div>
              </div>
              <div className={`${mx.annualStat} ${mx.annualStatLast}`}>
                <div className={mx.annualValue}>
                  {annualStats.avgWeeklyKm.toFixed(1)}
                </div>
                <div className={mx.annualLabel}>km/semana</div>
              </div>
            </div>

            {streaks && (
              <div className={mx.streakRow}>
                <div className={mx.streakCard}>
                  <div className={mx.streakFire}>🔥</div>
                  <div className={mx.streakNumber}>{streaks.currentStreak}</div>
                  <div className={mx.streakLabel}>racha actual (días)</div>
                </div>
                <div className={mx.streakCard}>
                  <div className={mx.streakFire}>⚡</div>
                  <div className={mx.streakNumber}>{streaks.longestStreak}</div>
                  <div className={mx.streakLabel}>mejor racha (días)</div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Personal Records ─────────────────────────────────────────────── */}
      <div className={mx.sectionBlock}>
        <div className={s.sectionLabel}>Marcas personales</div>
        <div className={mx.sectionHeading}>Personal Records</div>
        <div className={mx.sectionSub}>Mejor tiempo registrado por distancia</div>
        <PRDisplay />
      </div>

      {/* ── Actividad del año ────────────────────────────────────────────── */}
      <div className={mx.sectionBlock}>
        <div className={s.sectionLabel}>Historial</div>
        <div className={mx.sectionHeading}>Actividad del año</div>
        <div className={mx.sectionSub}>Kilómetros por día — últimas 52 semanas</div>
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
            <div className={s.sectionLabel}>Predicciones de carrera</div>
            <div className={s.sectionTitleSm}>Race predictor</div>
            {predictions?.predictions.length === 0 && (
              <div className={s.mutedText13}>
                Necesitas al menos una carrera de más de 3km para predecir
                tiempos.
              </div>
            )}
            {predictions?.predictions.map((pred) => (
              <div key={pred.distance} className={s.predictionRow}>
                <div className={s.predictionLeft}>
                  <div className={s.predictionBadge}>{pred.distance}</div>
                  <div className={s.predictionHint}>Proyectado (Riegel)</div>
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
