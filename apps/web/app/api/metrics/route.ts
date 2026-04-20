import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  calculateFitness,
  calculateRunTSS,
  estimateThresholdHR,
  zoneDistribution,
  secToPace,
} from "@pace/utils";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const activities = await prisma.activity.findMany({
    where: { userId: user.id },
    orderBy: { date: "asc" },
    select: {
      id: true,
      date: true,
      distanceM: true,
      durationSec: true,
      paceSeckm: true,
      avgHRbpm: true,
      tss: true,
    },
  });

  const thresholdHR = user.maxHR
    ? estimateThresholdHR(user.maxHR)
    : 160; // sensible default

  // Build daily TSS loads
  const dailyTSSMap = new Map<string, number>();
  for (const act of activities) {
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

  // Weekly aggregation
  const weeklyMap = new Map<
    string,
    { km: number; tss: number; paceSum: number; hrSum: number; count: number }
  >();

  for (const act of activities) {
    const d = new Date(act.date);
    // ISO week start: Monday
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(d.setDate(diff));
    const weekKey = weekStart.toISOString().split("T")[0]!;

    const existing = weeklyMap.get(weekKey) ?? {
      km: 0,
      tss: 0,
      paceSum: 0,
      hrSum: 0,
      count: 0,
    };

    let tss = act.tss ?? 0;
    if (!act.tss && act.avgHRbpm) {
      tss = calculateRunTSS(act.durationSec, act.avgHRbpm, thresholdHR);
    }

    weeklyMap.set(weekKey, {
      km: existing.km + act.distanceM / 1000,
      tss: existing.tss + tss,
      paceSum: existing.paceSum + act.paceSeckm,
      hrSum: existing.hrSum + (act.avgHRbpm ?? 0),
      count: existing.count + 1,
    });
  }

  const weeklyData = Array.from(weeklyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, data]) => ({
      week,
      km: Math.round(data.km * 10) / 10,
      tss: Math.round(data.tss),
      avgPace: data.count > 0 ? Math.round(data.paceSum / data.count) : 0,
      avgPaceFormatted:
        data.count > 0
          ? secToPace(Math.round(data.paceSum / data.count))
          : "--",
      avgHR:
        data.count > 0 ? Math.round(data.hrSum / data.count) : 0,
      sessions: data.count,
    }));

  // Zone distribution (last 90 days)
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const recentActivities = activities.filter(
    (a) => a.date >= ninetyDaysAgo,
  );

  const zones =
    user.maxHR
      ? zoneDistribution(
          recentActivities.map((a) => ({
            durationSec: a.durationSec,
            avgHRbpm: a.avgHRbpm,
          })),
          user.maxHR,
        )
      : null;

  // --- Streaks ---
  const allActivities = await prisma.activity.findMany({
    where: { userId: user.id },
    select: { date: true, distanceM: true, elevationM: true },
    orderBy: { date: "asc" },
  });

  const activeDateSet = new Set<string>(
    allActivities.map((a) => a.date.toISOString().split("T")[0]!),
  );

  // Current streak: count backwards from today
  let currentStreak = 0;
  const todayStr = new Date().toISOString().split("T")[0]!;
  const cursor = new Date();
  // Start from today; if today has no activity, streak is 0
  if (activeDateSet.has(todayStr)) {
    currentStreak = 1;
    cursor.setDate(cursor.getDate() - 1);
    while (activeDateSet.has(cursor.toISOString().split("T")[0]!)) {
      currentStreak++;
      cursor.setDate(cursor.getDate() - 1);
    }
  }

  // Longest streak: iterate sorted active dates
  const sortedDates = Array.from(activeDateSet).sort();
  let longestStreak = sortedDates.length > 0 ? 1 : 0;
  let runningStreak = sortedDates.length > 0 ? 1 : 0;
  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1]!);
    const curr = new Date(sortedDates[i]!);
    const diffDays =
      (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays === 1) {
      runningStreak++;
      if (runningStreak > longestStreak) longestStreak = runningStreak;
    } else {
      runningStreak = 1;
    }
  }

  // --- Annual stats ---
  const yearStart = new Date(new Date().getFullYear(), 0, 1);
  const yearActivities = allActivities.filter((a) => a.date >= yearStart);

  const annualTotalKm =
    yearActivities.reduce((sum, a) => sum + a.distanceM / 1000, 0);
  const annualActiveDays = new Set(
    yearActivities.map((a) => a.date.toISOString().split("T")[0]!),
  ).size;
  const annualTotalElevation = yearActivities.reduce(
    (sum, a) => sum + (a.elevationM ?? 0),
    0,
  );

  // Completed weeks of this year up to today (at least 1)
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const completedWeeks = Math.max(
    1,
    Math.floor((Date.now() - yearStart.getTime()) / msPerWeek),
  );
  const avgWeeklyKm = annualTotalKm / completedWeeks;

  return NextResponse.json({
    fitness,
    weeklyData,
    zones,
    maxHR: user.maxHR,
    streaks: {
      currentStreak,
      longestStreak,
    },
    annualStats: {
      totalKm: Math.round(annualTotalKm * 10) / 10,
      totalRuns: yearActivities.length,
      activeDays: annualActiveDays,
      totalElevationM: Math.round(annualTotalElevation),
      avgWeeklyKm: Math.round(avgWeeklyKm * 10) / 10,
    },
  });
}
