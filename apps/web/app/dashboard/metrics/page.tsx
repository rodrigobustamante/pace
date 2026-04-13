"use client";

import { useQuery } from "@tanstack/react-query";
import { PaceEvolutionChart } from "@/components/charts/PaceEvolutionChart";
import { HREvolutionChart } from "@/components/charts/HREvolutionChart";
import { LoadChart } from "@/components/charts/LoadChart";
import { SkeletonCard } from "@/components/SkeletonCard";
import * as grid from "@/styles/dashboardGrid.css";
import * as s from "@/styles/pagesShared.css";

interface MetricsResponse {
  weeklyData: Array<{
    week: string;
    km: number;
    tss: number;
    avgPace: number;
    avgHR: number;
    sessions: number;
  }>;
}

interface PredictionsResponse {
  predictions: Array<{
    distance: string;
    distanceM: number;
    predictedTimeSec: number;
    predictedTimeFormatted: string;
  }>;
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
