"use client";

import { useQuery } from "@tanstack/react-query";
import { StatCard } from "@/components/StatCard";
import { VolumeChart } from "@/components/charts/VolumeChart";
import { FitnessChart } from "@/components/charts/FitnessChart";
import { HRZonesChart } from "@/components/charts/HRZonesChart";
import { RadarPerformanceChart } from "@/components/charts/RadarPerformanceChart";
import { SkeletonCard } from "@/components/SkeletonCard";
import { HRZonesSetup } from "@/components/HRZonesSetup";
import { secToPace, tsbLabel } from "@pace/utils";
import Link from "next/link";

interface MetricsResponse {
  fitness: Array<{ date: string; ctl: number; atl: number; tsb: number }>;
  weeklyData: Array<{
    week: string;
    km: number;
    tss: number;
    avgPace: number;
    avgHR: number;
    sessions: number;
  }>;
  zones: {
    z1: number;
    z2: number;
    z3: number;
    z4: number;
    z5: number;
  } | null;
  maxHR: number | null;
}

interface ActivitiesResponse {
  activities: Array<{
    id: string;
    name: string;
    distanceM: number;
    durationSec: number;
    paceSeckm: number;
    avgHRbpm: number | null;
    date: string;
  }>;
}

export default function DashboardPage() {
  const { data: metrics, isLoading: loadingMetrics } =
    useQuery<MetricsResponse>({
      queryKey: ["metrics"],
      queryFn: () => fetch("/api/metrics").then((r) => r.json()),
    });

  const { data: activitiesData, isLoading: loadingActivities } =
    useQuery<ActivitiesResponse>({
      queryKey: ["activities", { page: 1, limit: 5 }],
      queryFn: () =>
        fetch("/api/activities?page=1&limit=5").then((r) => r.json()),
    });

  const lastWeekData = metrics?.weeklyData?.slice(-1)[0];
  const prevWeekData = metrics?.weeklyData?.slice(-2, -1)[0];
  const latestFitness = metrics?.fitness?.slice(-1)[0];
  const lastActivity = activitiesData?.activities?.[0];

  const weekPct =
    lastWeekData && prevWeekData && prevWeekData.km > 0
      ? Math.round(
          ((lastWeekData.km - prevWeekData.km) / prevWeekData.km) * 100,
        )
      : null;

  const tsb = latestFitness?.tsb ?? 0;

  // Radar data derived from available metrics
  const totalWeeks = metrics?.weeklyData?.length ?? 1;
  const recentWeeks = metrics?.weeklyData?.slice(-4) ?? [];
  const avgKm =
    recentWeeks.reduce((s, w) => s + w.km, 0) / (recentWeeks.length || 1);
  const radarData = [
    {
      metric: "Volumen",
      value: Math.min(100, Math.round((avgKm / 80) * 100)),
    },
    {
      metric: "Consistencia",
      value: Math.min(100, Math.round((totalWeeks / 12) * 100)),
    },
    {
      metric: "Intensidad",
      value: Math.min(
        100,
        Math.round(
          ((lastWeekData?.tss ?? 0) / 150) * 100,
        ),
      ),
    },
    {
      metric: "Recuperación",
      value: tsb > 0 ? Math.min(100, 60 + tsb * 2) : Math.max(20, 60 + tsb),
    },
    {
      metric: "Cadencia",
      value: 72, // placeholder without cadence data aggregate
    },
    {
      metric: "Economía",
      value: 68, // placeholder
    },
  ];

  const today = new Date().toLocaleDateString("es", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div>
      {/* Hero */}
      <div className="fade-up fade-up-1" style={{ marginBottom: 28 }}>
        <div
          style={{
            fontSize: 11,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "#475569",
            marginBottom: 6,
            fontFamily: "'DM Mono', monospace",
          }}
        >
          Esta semana · {today}
        </div>
        <div className="hero-title">
          Buenos días,{" "}
          <span style={{ color: "#fb923c" }}>corredor</span>
        </div>
      </div>

      {/* KPI Row */}
      <div className="fade-up fade-up-2 rg-4">
        {loadingMetrics || loadingActivities ? (
          <>
            <SkeletonCard height={100} />
            <SkeletonCard height={100} />
            <SkeletonCard height={100} />
            <SkeletonCard height={100} />
          </>
        ) : (
          <>
            <StatCard
              label="Km esta semana"
              value={lastWeekData ? `${lastWeekData.km.toFixed(1)}` : "—"}
              sub={
                weekPct != null
                  ? `${weekPct > 0 ? "↑" : "↓"} ${Math.abs(weekPct)}% vs semana anterior`
                  : "primera semana registrada"
              }
              accent="#fb923c"
            />
            <StatCard
              label="Pace promedio"
              value={
                lastActivity
                  ? secToPace(lastActivity.paceSeckm)
                  : "—"
              }
              sub="min/km · último run"
              accent="#60a5fa"
            />
            <StatCard
              label="FC promedio"
              value={
                lastActivity?.avgHRbpm
                  ? `${lastActivity.avgHRbpm}`
                  : "—"
              }
              sub="bpm · último run"
              accent="#4ade80"
            />
            <StatCard
              label="Forma (TSB)"
              value={`${tsb > 0 ? "+" : ""}${tsb}`}
              sub={tsbLabel(tsb)}
              accent={tsb < -5 ? "#f97316" : "#e879f9"}
            />
          </>
        )}
      </div>

      {/* Charts row */}
      <div className="fade-up fade-up-3 rg-2-1">
        {loadingMetrics ? (
          <>
            <SkeletonCard height={260} />
            <SkeletonCard height={260} />
          </>
        ) : (
          <>
            <VolumeChart data={metrics?.weeklyData ?? []} />
            <RadarPerformanceChart data={radarData} />
          </>
        )}
      </div>

      {/* Fitness + Zones */}
      <div className="fade-up fade-up-4 rg-3-2">
        {loadingMetrics ? (
          <>
            <SkeletonCard height={260} />
            <SkeletonCard height={260} />
          </>
        ) : (
          <>
            <FitnessChart data={metrics?.fitness ?? []} />
            {metrics?.zones ? (
              <HRZonesChart zones={metrics.zones} maxHR={metrics.maxHR} />
            ) : (
              <HRZonesSetup currentMaxHR={metrics?.maxHR} settingsHref="/dashboard/settings" />
            )}
          </>
        )}
      </div>

      {/* Coach Banner */}
      <div
        className="fade-up fade-up-5"
        style={{
          background: "rgba(249,115,22,0.08)",
          border: "1px solid rgba(249,115,22,0.2)",
          borderRadius: 16,
          padding: "16px 24px",
        }}
      >
        <div
          className="coach-banner-inner"
          style={{ display: "flex", alignItems: "center", gap: 16 }}
        >
          <div style={{ fontSize: 28 }}>🤖</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#fb923c", marginBottom: 2 }}>
              Coach IA · Análisis disponible
            </div>
            <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.5 }}>
              Obtén tu análisis semanal personalizado basado en tus datos reales de Strava.
            </div>
          </div>
          <div className="coach-banner-btn" style={{ marginLeft: "auto", whiteSpace: "nowrap" }}>
            <Link
              href="/dashboard/coach"
              style={{
                background: "rgba(249,115,22,0.2)",
                border: "1px solid rgba(249,115,22,0.3)",
                borderRadius: 8,
                padding: "8px 16px",
                color: "#fb923c",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Ver análisis →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
