"use client";

import { useQuery } from "@tanstack/react-query";
import { PaceEvolutionChart } from "@/components/charts/PaceEvolutionChart";
import { HREvolutionChart } from "@/components/charts/HREvolutionChart";
import { LoadChart } from "@/components/charts/LoadChart";
import { SkeletonCard } from "@/components/SkeletonCard";

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
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontSize: 32,
            fontWeight: 900,
            fontFamily: "'Barlow Condensed', sans-serif",
          }}
        >
          Métricas de evolución
        </div>
        <div style={{ fontSize: 13, color: "#475569", marginTop: 4 }}>
          {totalWeeks > 0
            ? `${totalWeeks} semanas · ${firstWeek} → ${lastWeek}`
            : "Cargando datos..."}
        </div>
      </div>

      {isLoading || loadingPred ? (
        <div className="rg-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} height={260} />
          ))}
        </div>
      ) : (
        <div className="rg-2">
          <PaceEvolutionChart data={weeklyData} />
          <HREvolutionChart data={weeklyData} />
          <LoadChart data={weeklyData} />

          {/* Race predictions */}
          <div
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 16,
              padding: 24,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#94a3b8",
                marginBottom: 4,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Predicciones de carrera
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 800,
                fontFamily: "'Barlow Condensed', sans-serif",
                marginBottom: 20,
              }}
            >
              Race predictor
            </div>
            {predictions?.predictions.length === 0 && (
              <div style={{ color: "#475569", fontSize: 13 }}>
                Necesitas al menos una carrera de más de 3km para predecir tiempos.
              </div>
            )}
            {predictions?.predictions.map((pred) => (
              <div
                key={pred.distance}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: 12 }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      background: "rgba(249,115,22,0.1)",
                      border: "1px solid rgba(249,115,22,0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#fb923c",
                      fontFamily: "'Barlow Condensed', sans-serif",
                    }}
                  >
                    {pred.distance}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>
                    Proyectado (Riegel)
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    fontFamily: "'Barlow Condensed', sans-serif",
                    color: "#f1f5f9",
                  }}
                >
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
