"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import { StatCard } from "@/components/StatCard";
import { VolumeChart } from "@/components/charts/VolumeChart";
import { FitnessChart } from "@/components/charts/FitnessChart";
import { HRZonesChart } from "@/components/charts/HRZonesChart";
import { RadarPerformanceChart } from "@/components/charts/RadarPerformanceChart";
import { SkeletonCard } from "@/components/SkeletonCard";
import { HRZonesSetup } from "@/components/HRZonesSetup";
import { secToPace, tsbLabel } from "@pace/utils";
import Link from "next/link";
import * as grid from "@/styles/dashboardGrid.css";
import * as shared from "@/styles/pagesShared.css";

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
  const t = useTranslations("dashboard");
  const locale = useLocale();

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

  const totalWeeks = metrics?.weeklyData?.length ?? 1;
  const recentWeeks = metrics?.weeklyData?.slice(-4) ?? [];
  const avgKm =
    recentWeeks.reduce((s, w) => s + w.km, 0) / (recentWeeks.length || 1);

  const radarData = [
    { metric: t("radar.volume"), value: Math.min(100, Math.round((avgKm / 80) * 100)) },
    { metric: t("radar.consistency"), value: Math.min(100, Math.round((totalWeeks / 12) * 100)) },
    { metric: t("radar.intensity"), value: Math.min(100, Math.round(((lastWeekData?.tss ?? 0) / 150) * 100)) },
    { metric: t("radar.recovery"), value: tsb > 0 ? Math.min(100, 60 + tsb * 2) : Math.max(20, 60 + tsb) },
    { metric: t("radar.cadence"), value: 72 },
    { metric: t("radar.economy"), value: 68 },
  ];

  const today = new Date().toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div>
      <div className={`${grid.fadeUp1} ${shared.heroBlock}`}>
        <div className={shared.heroMeta}>{t("thisWeek")} · {today}</div>
        <div className={grid.heroTitle}>
          {t("greeting")}{" "}
          <span className={shared.accentOrange}>{t("greetingRunner")}</span>
        </div>
      </div>

      <div className={`${grid.fadeUp2} ${grid.rg4}`}>
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
              label={t("stats.weeklyKm")}
              value={lastWeekData ? `${lastWeekData.km.toFixed(1)}` : "—"}
              sub={
                weekPct != null
                  ? weekPct > 0
                    ? t("stats.weeklyKmUp", { pct: Math.abs(weekPct) })
                    : t("stats.weeklyKmDown", { pct: Math.abs(weekPct) })
                  : t("stats.weeklyKmFirst")
              }
              accent="#fb923c"
            />
            <StatCard
              label={t("stats.avgPace")}
              value={lastActivity ? secToPace(lastActivity.paceSeckm) : "—"}
              sub={t("stats.avgPaceSub")}
              accent="#60a5fa"
            />
            <StatCard
              label={t("stats.avgHR")}
              value={lastActivity?.avgHRbpm ? `${lastActivity.avgHRbpm}` : "—"}
              sub={t("stats.avgHRSub")}
              accent="#4ade80"
            />
            <StatCard
              label={t("stats.form")}
              value={`${tsb > 0 ? "+" : ""}${tsb}`}
              sub={tsbLabel(tsb)}
              accent={tsb < -5 ? "#f97316" : "#e879f9"}
            />
          </>
        )}
      </div>

      <div className={`${grid.fadeUp3} ${grid.rg21}`}>
        {loadingMetrics ? (
          <>
            <SkeletonCard height={420} />
            <SkeletonCard height={420} />
          </>
        ) : (
          <>
            <VolumeChart data={metrics?.weeklyData ?? []} />
            <RadarPerformanceChart data={radarData} />
          </>
        )}
      </div>

      <div className={`${grid.fadeUp4} ${grid.rg32}`}>
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
              <HRZonesSetup
                currentMaxHR={metrics?.maxHR}
                settingsHref="/dashboard/settings"
              />
            )}
          </>
        )}
      </div>

      <div className={`${grid.fadeUp5} ${shared.coachBanner}`}>
        <div className={`${shared.coachBannerRow} ${grid.coachBannerInner}`}>
          <div className={shared.emoji28}>🤖</div>
          <div className={shared.flex1}>
            <div className={shared.coachBannerTitle}>{t("coachBanner.title")}</div>
            <div className={shared.coachBannerBody}>{t("coachBanner.body")}</div>
          </div>
          <div className={grid.coachBannerBtn}>
            <Link href="/dashboard/coach" className={shared.coachCtaLink}>
              {t("coachBanner.cta")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
