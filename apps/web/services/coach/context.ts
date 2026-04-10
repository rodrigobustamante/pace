import { prisma } from "@/lib/db";
import {
  calculateFitness,
  calculateRunTSS,
  estimateThresholdHR,
  zoneDistribution,
  secToPace,
  mToKm,
} from "@pace/utils";

export interface WeeklyContext {
  userName: string;
  maxHR: number | null;
  thresholdHR: number;
  ctl: number;
  atl: number;
  tsb: number;
  tsbTrend: "improving" | "declining" | "stable";
  weekStart: string;
  weekEnd: string;
  weeklyKm: number;
  activitiesCount: number;
  weeklyTSS: number;
  avgPaceFormatted: string;
  avgHR: number;
  zoneDistribution: string;
  zoneRanges: string;
  prevWeekKm: number;
  prevWeekTSS: number;
  volumeChangePct: number;
  recentActivities: Array<{
    date: string;
    name: string;
    km: string;
    pace: string;
    avgHR: number | null;
  }>;
}

export async function buildWeeklyContext(userId: string): Promise<WeeklyContext> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  const thresholdHR = user.maxHR ? estimateThresholdHR(user.maxHR) : 160;

  // All activities for CTL/ATL
  const allActivities = await prisma.activity.findMany({
    where: { userId },
    orderBy: { date: "asc" },
    select: {
      date: true,
      durationSec: true,
      distanceM: true,
      paceSeckm: true,
      avgHRbpm: true,
      tss: true,
      name: true,
    },
  });

  // Daily TSS map
  const dailyTSSMap = new Map<string, number>();
  for (const act of allActivities) {
    const dateKey = act.date.toISOString().split("T")[0]!;
    let tss = act.tss;
    if (tss == null && act.avgHRbpm) {
      tss = calculateRunTSS(act.durationSec, act.avgHRbpm, thresholdHR);
    }
    dailyTSSMap.set(dateKey, (dailyTSSMap.get(dateKey) ?? 0) + (tss ?? 0));
  }

  const dailyLoads = Array.from(dailyTSSMap.entries()).map(([date, tss]) => ({
    date,
    tss,
  }));

  const fitness = calculateFitness(dailyLoads);
  const latest = fitness[fitness.length - 1];
  const prev = fitness[fitness.length - 2];

  const ctl = latest?.ctl ?? 0;
  const atl = latest?.atl ?? 0;
  const tsb = latest?.tsb ?? 0;

  const tsbTrend: WeeklyContext["tsbTrend"] =
    prev == null
      ? "stable"
      : tsb - prev.tsb > 1
        ? "improving"
        : tsb - prev.tsb < -1
          ? "declining"
          : "stable";

  // This week boundaries (Mon–Sun)
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() + mondayOffset);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const prevWeekStart = new Date(weekStart);
  prevWeekStart.setDate(weekStart.getDate() - 7);
  const prevWeekEnd = new Date(weekStart);
  prevWeekEnd.setMilliseconds(-1);

  const thisWeekActs = allActivities.filter(
    (a) => a.date >= weekStart && a.date <= weekEnd,
  );
  const prevWeekActs = allActivities.filter(
    (a) => a.date >= prevWeekStart && a.date <= prevWeekEnd,
  );

  const weeklyKm =
    thisWeekActs.reduce((s, a) => s + a.distanceM / 1000, 0);
  const prevWeekKm =
    prevWeekActs.reduce((s, a) => s + a.distanceM / 1000, 0);

  const computeTSS = (acts: typeof allActivities) =>
    acts.reduce((s, a) => {
      let tss = a.tss ?? 0;
      if (!a.tss && a.avgHRbpm) {
        tss = calculateRunTSS(a.durationSec, a.avgHRbpm, thresholdHR);
      }
      return s + tss;
    }, 0);

  const weeklyTSS = Math.round(computeTSS(thisWeekActs));
  const prevWeekTSS = Math.round(computeTSS(prevWeekActs));

  const avgPace =
    thisWeekActs.length > 0
      ? Math.round(
          thisWeekActs.reduce((s, a) => s + a.paceSeckm, 0) /
            thisWeekActs.length,
        )
      : 0;

  const avgHR =
    thisWeekActs.filter((a) => a.avgHRbpm).length > 0
      ? Math.round(
          thisWeekActs
            .filter((a) => a.avgHRbpm)
            .reduce((s, a) => s + (a.avgHRbpm ?? 0), 0) /
            thisWeekActs.filter((a) => a.avgHRbpm).length,
        )
      : 0;

  const volumeChangePct =
    prevWeekKm > 0
      ? Math.round(((weeklyKm - prevWeekKm) / prevWeekKm) * 100)
      : 0;

  // Last 3 activities
  const recentActivities = allActivities
    .slice(-3)
    .reverse()
    .map((a) => ({
      date: a.date.toISOString().split("T")[0]!,
      name: a.name,
      km: mToKm(a.distanceM),
      pace: secToPace(a.paceSeckm),
      avgHR: a.avgHRbpm,
    }));

  // Zone distribution — last 90 days
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const recentForZones = allActivities
    .filter((a) => a.date >= ninetyDaysAgo)
    .map((a) => ({ durationSec: a.durationSec, avgHRbpm: a.avgHRbpm }));

  const zones = user.maxHR
    ? zoneDistribution(recentForZones, user.maxHR)
    : null;

  const zoneDistStr = zones
    ? `Z1 ${Math.round(zones.z1)}min, Z2 ${Math.round(zones.z2)}min, Z3 ${Math.round(zones.z3)}min, Z4 ${Math.round(zones.z4)}min, Z5 ${Math.round(zones.z5)}min`
    : "sin datos (FC máx no configurada)";

  const zoneRangesStr = user.maxHR
    ? [
        `Z1 Base: < ${Math.round(user.maxHR * 0.6)} bpm`,
        `Z2 Aeróbico: ${Math.round(user.maxHR * 0.6)}–${Math.round(user.maxHR * 0.7) - 1} bpm`,
        `Z3 Umbral: ${Math.round(user.maxHR * 0.7)}–${Math.round(user.maxHR * 0.8) - 1} bpm`,
        `Z4 VO2max: ${Math.round(user.maxHR * 0.8)}–${Math.round(user.maxHR * 0.9) - 1} bpm`,
        `Z5 Neuromuscular: ≥ ${Math.round(user.maxHR * 0.9)} bpm`,
      ].join(" | ")
    : "no disponible";

  return {
    userName: user.name,
    maxHR: user.maxHR,
    thresholdHR,
    ctl: Math.round(ctl),
    atl: Math.round(atl),
    tsb: Math.round(tsb),
    tsbTrend,
    weekStart: weekStart.toISOString().split("T")[0]!,
    weekEnd: weekEnd.toISOString().split("T")[0]!,
    weeklyKm,
    activitiesCount: thisWeekActs.length,
    weeklyTSS,
    avgPaceFormatted: avgPace > 0 ? secToPace(avgPace) : "—",
    avgHR,
    zoneDistribution: zoneDistStr,
    zoneRanges: zoneRangesStr,
    prevWeekKm,
    prevWeekTSS,
    volumeChangePct,
    recentActivities,
  };
}
