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

  return NextResponse.json({ fitness, weeklyData, zones });
}
