import { prisma } from "@/lib/db";
import {
  calculateFitness,
  calculateRunTSS,
  estimateThresholdHR,
  zoneDistribution,
  secToPace,
  mToKm,
  assessOverttrainingRisk,
  projectFitnessToDate,
  type OverttrainingRisk,
  type RaceProjection,
} from "@pace/utils";

// ─── Timezone utilities ───────────────────────────────────────────────────────

/** User's current date as YYYY-MM-DD in their timezone (e.g. "2026-04-25") */
export function localDateStr(tz: string): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: tz });
}

/** 0=Sun, 1=Mon … 6=Sat in the user's timezone */
function localDayOfWeekNum(tz: string): number {
  const name = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "long",
  }).format(new Date());
  const idx = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"].indexOf(name);
  return idx === -1 ? 0 : idx;
}

const ES_DAY_NAMES = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];

/** YYYY-MM-DD of the Monday that starts the current local week */
function localWeekStartStr(tz: string): string {
  const todayStr = localDateStr(tz);
  const dayNum   = localDayOfWeekNum(tz);
  const offset   = dayNum === 0 ? -6 : 1 - dayNum;
  const [y, m, d] = todayStr.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d! + offset)).toISOString().split("T")[0]!;
}

/** Activity date as YYYY-MM-DD in the user's timezone */
function actLocalStr(date: Date, tz: string): string {
  return date.toLocaleDateString("en-CA", { timeZone: tz });
}

/** Seconds until the next local midnight (min 60 s, for cache TTL) */
export function secsUntilLocalMidnight(tz: string): number {
  const t = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date()); // "22:30:45"
  const [h, min, s] = t.split(":").map(Number);
  return Math.max(60, 86400 - (h! * 3600 + min! * 60 + s!));
}

export interface PlannedWorkout {
  date: string;
  title: string;
  workoutType: string;
  durationMin: number;
  description: string;
}

export interface MilestoneSummary {
  id: string;
  title: string;
  goalType: string;
  targetDate: string;
  daysUntilRace: number;
  location: string | null;
  priority: string;
}

export type GoalContext = {
  hasGoal: false;
} | {
  hasGoal: true;
  // Active milestone (nearest upcoming with a training plan)
  goalId: string;
  goalTitle: string;
  goalType: string;
  targetDate: string;
  daysUntilRace: number;
  location: string | null;
  priority: string;
  todayWorkout: PlannedWorkout | null;
  nextWorkout: PlannedWorkout | null;
  upcomingWeek: PlannedWorkout[];
  planProgress: {
    totalDays: number;
    confirmedDays: number;
    skippedDays: number;
    pendingDays: number;
  };
  raceProjection: RaceProjection | null;
  // All upcoming milestones on the athlete's timeline (including the active one)
  allMilestones: MilestoneSummary[];
}

export interface LongRunRecovery {
  longRunDate: string;
  longRunKm: string;
  daysSinceLongRun: number;
  recoveryDays: Array<{
    daysAfter: number;
    km: string;
    pace: string;
    avgHR: number | null;
    tss: number | null;
  }>;
}

export { type OverttrainingRisk, type RaceProjection };

/** Renders a GoalContext as a prompt-ready text block. */
export function formatGoalForPrompt(goal: GoalContext): string {
  if (!goal.hasGoal) return "Sin objetivo activo.";

  const locationStr = goal.location ? ` en ${goal.location}` : "";
  const priorityLabel =
    goal.priority === "A" ? "Carrera principal (A)"
    : goal.priority === "B" ? "Carrera secundaria (B)"
    : "Carrera de entrenamiento (C)";

  const lines: string[] = [
    `Hito activo: ${goal.goalTitle}${locationStr} — ${goal.targetDate} (${goal.daysUntilRace} días) [${priorityLabel}]`,
    `Progreso del plan: ${goal.planProgress.confirmedDays} confirmados, ${goal.planProgress.skippedDays} saltados, ${goal.planProgress.pendingDays} pendientes de ${goal.planProgress.totalDays} total`,
  ];

  if (goal.todayWorkout) {
    const tw = goal.todayWorkout;
    const label =
      tw.workoutType === "unknown"
        ? "Descanso"
        : `${tw.title} (${tw.durationMin} min, ${tw.workoutType})`;
    lines.push(`Entrenamiento planificado para HOY: ${label}`);
    if (tw.workoutType !== "unknown") lines.push(`  → ${tw.description}`);
  }

  if (goal.nextWorkout) {
    const nw = goal.nextWorkout;
    lines.push(
      `Próximo entrenamiento: ${nw.date} — ${nw.title} (${nw.durationMin} min, ${nw.workoutType})`,
    );
  }

  if (goal.upcomingWeek.length > 0) {
    lines.push("Próximos 7 días del plan:");
    for (const d of goal.upcomingWeek) {
      const label =
        d.workoutType === "unknown"
          ? "Descanso"
          : `${d.title} (${d.durationMin} min)`;
      lines.push(`  ${d.date}: ${label}`);
    }
  }

  // Full milestone timeline (so AI knows races ahead)
  if (goal.allMilestones.length > 1) {
    lines.push("Timeline completo de hitos:");
    for (const m of goal.allMilestones) {
      const loc = m.location ? ` — ${m.location}` : "";
      const tag = m.priority === "A" ? " [A]" : m.priority === "B" ? " [B]" : " [C]";
      lines.push(`  ${m.targetDate}: ${m.title}${loc}${tag} (${m.daysUntilRace} días)`);
    }
  }

  return lines.join("\n");
}

export async function buildGoalContext(
  userId: string,
  currentCtl = 0,
  currentAtl = 0,
  tz = "UTC",
): Promise<GoalContext> {
  const todayStr = localDateStr(tz);

  // Fetch all active milestones sorted by race date
  const allGoals = await prisma.goal.findMany({
    where: { userId, isActive: true },
    orderBy: { targetDate: "asc" },
    include: {
      trainingPlan: {
        include: { days: { orderBy: { date: "asc" } } },
      },
    },
  });

  // Only consider future milestones (race date >= today)
  const futureGoals = allGoals.filter(
    (g) => g.targetDate.toISOString().split("T")[0]! >= todayStr,
  );

  if (futureGoals.length === 0) return { hasGoal: false };

  // Active = nearest upcoming milestone that has a training plan
  // Fall back to nearest without a plan if none have one
  const active =
    futureGoals.find((g) => g.trainingPlan != null) ?? futureGoals[0]!;

  if (!active.trainingPlan) {
    // Has milestones but no plan yet — return minimal context
    const targetDateStr = active.targetDate.toISOString().split("T")[0]!;
    const daysUntilRace = Math.ceil(
      (new Date(targetDateStr).getTime() - new Date(todayStr).getTime()) /
        (1000 * 60 * 60 * 24),
    );
    return {
      hasGoal: true,
      goalId: active.id,
      goalTitle: active.title,
      goalType: active.goalType,
      targetDate: targetDateStr,
      daysUntilRace,
      location: active.location ?? null,
      priority: active.priority,
      todayWorkout: null,
      nextWorkout: null,
      upcomingWeek: [],
      planProgress: { totalDays: 0, confirmedDays: 0, skippedDays: 0, pendingDays: 0 },
      raceProjection: null,
      allMilestones: futureGoals.map((g) => {
        const ds = g.targetDate.toISOString().split("T")[0]!;
        return {
          id: g.id,
          title: g.title,
          goalType: g.goalType,
          targetDate: ds,
          daysUntilRace: Math.ceil(
            (new Date(ds).getTime() - new Date(todayStr).getTime()) /
              (1000 * 60 * 60 * 24),
          ),
          location: g.location ?? null,
          priority: g.priority,
        };
      }),
    };
  }

  const targetDateStr = active.targetDate.toISOString().split("T")[0]!;
  const daysUntilRace = Math.ceil(
    (new Date(targetDateStr).getTime() - new Date(todayStr).getTime()) /
      (1000 * 60 * 60 * 24),
  );

  const days = active.trainingPlan.days;
  const futureDays = days.filter(
    (d) => d.date.toISOString().split("T")[0]! >= todayStr,
  );

  const todayDay = futureDays.find(
    (d) => d.date.toISOString().split("T")[0] === todayStr,
  );
  const nextWorkoutDay = futureDays.find(
    (d) =>
      d.date.toISOString().split("T")[0]! > todayStr &&
      d.workoutType !== "unknown",
  );

  const [ty, tm, td] = todayStr.split("-").map(Number);
  const sevenDaysLaterStr = new Date(Date.UTC(ty!, tm! - 1, td! + 7))
    .toISOString()
    .split("T")[0]!;

  const upcomingWeek = futureDays
    .filter((d) => d.date.toISOString().split("T")[0]! <= sevenDaysLaterStr)
    .map((d) => ({
      date: d.date.toISOString().split("T")[0]!,
      title: d.title,
      workoutType: d.workoutType,
      durationMin: d.durationMin,
      description: d.description,
    }));

  const toPlanned = (d: (typeof days)[0] | undefined): PlannedWorkout | null =>
    d
      ? {
          date: d.date.toISOString().split("T")[0]!,
          title: d.title,
          workoutType: d.workoutType,
          durationMin: d.durationMin,
          description: d.description,
        }
      : null;

  const totalDays = days.length;
  const confirmedDays = days.filter((d) => d.willTrain === true).length;
  const skippedDays = days.filter((d) => d.willTrain === false).length;
  const pendingDays = days.filter((d) => d.willTrain === null).length;

  let raceProjection: RaceProjection | null = null;
  if (daysUntilRace > 0 && currentCtl > 0) {
    const planWorkouts = days.map((d) => ({
      date: d.date.toISOString().split("T")[0]!,
      workoutType: d.workoutType,
      durationMin: d.durationMin,
    }));
    raceProjection = projectFitnessToDate(
      currentCtl,
      currentAtl,
      todayStr,
      targetDateStr,
      planWorkouts,
    );
  }

  // Build summary for all future milestones
  const allMilestones: MilestoneSummary[] = futureGoals.map((g) => {
    const ds = g.targetDate.toISOString().split("T")[0]!;
    return {
      id: g.id,
      title: g.title,
      goalType: g.goalType,
      targetDate: ds,
      daysUntilRace: Math.ceil(
        (new Date(ds).getTime() - new Date(todayStr).getTime()) /
          (1000 * 60 * 60 * 24),
      ),
      location: g.location ?? null,
      priority: g.priority,
    };
  });

  return {
    hasGoal: true,
    goalId: active.id,
    goalTitle: active.title,
    goalType: active.goalType,
    targetDate: targetDateStr,
    daysUntilRace,
    location: active.location ?? null,
    priority: active.priority,
    todayWorkout: toPlanned(todayDay),
    nextWorkout: toPlanned(nextWorkoutDay),
    upcomingWeek,
    planProgress: { totalDays, confirmedDays, skippedDays, pendingDays },
    raceProjection,
    allMilestones,
  };
}

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
    feel: number | null;
  }>;
  goal: GoalContext;
  overttrainingRisk: OverttrainingRisk;
  longRunRecovery: LongRunRecovery | null;
}

export interface DailyContext {
  userName: string;
  maxHR: number | null;
  thresholdHR: number;
  todayDate: string;
  dayOfWeek: string;
  ctl: number;
  atl: number;
  tsb: number;
  tsbTrend: "improving" | "declining" | "stable";
  weekSessionsCount: number;
  weeklyKm: number;
  weeklyTSS: number;
  weekSessionTypes: string;
  daysSinceLastRun: number;
  lastActivity: {
    date: string;
    name: string;
    type: string;
    km: string;
    pace: string;
    avgHR: number | null;
    tss: number | null;
    daysAgo: number;
  } | null;
  consecutiveRunDays: number;
  goal: GoalContext;
  overttrainingRisk: OverttrainingRisk;
}

export async function buildDailyContext(userId: string, tz = "UTC"): Promise<DailyContext> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const thresholdHR = user.maxHR ? estimateThresholdHR(user.maxHR) : 160;

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
      type: true,
    },
  });

  // CTL/ATL/TSB
  const dailyTSSMap = new Map<string, number>();
  for (const act of allActivities) {
    const dateKey = act.date.toISOString().split("T")[0]!;
    let tss = act.tss;
    if (tss == null && act.avgHRbpm) {
      tss = calculateRunTSS(act.durationSec, act.avgHRbpm, thresholdHR);
    }
    dailyTSSMap.set(dateKey, (dailyTSSMap.get(dateKey) ?? 0) + (tss ?? 0));
  }
  const dailyLoads = Array.from(dailyTSSMap.entries()).map(([date, tss]) => ({ date, tss }));
  const fitness = calculateFitness(dailyLoads);
  const latest = fitness[fitness.length - 1];
  const prev = fitness[fitness.length - 2];

  const ctl = latest?.ctl ?? 0;
  const atl = latest?.atl ?? 0;
  const tsb = latest?.tsb ?? 0;
  const tsbTrend: DailyContext["tsbTrend"] =
    prev == null ? "stable"
    : tsb - prev.tsb > 1 ? "improving"
    : tsb - prev.tsb < -1 ? "declining"
    : "stable";

  // This week (Mon–today) in the user's timezone
  const now = new Date();
  const todayStr  = localDateStr(tz);
  const dayNum    = localDayOfWeekNum(tz);
  const dayOfWeek = ES_DAY_NAMES[dayNum]!;
  const weekStartStr = localWeekStartStr(tz);

  const thisWeekActs = allActivities.filter(
    (a) => actLocalStr(a.date, tz) >= weekStartStr,
  );

  const weeklyKm = thisWeekActs.reduce((s, a) => s + a.distanceM / 1000, 0);
  const weeklyTSS = Math.round(
    thisWeekActs.reduce((s, a) => {
      const tss = a.tss ?? (a.avgHRbpm ? calculateRunTSS(a.durationSec, a.avgHRbpm, thresholdHR) : 0);
      return s + tss;
    }, 0),
  );

  const typeCount = new Map<string, number>();
  for (const a of thisWeekActs) {
    typeCount.set(a.type, (typeCount.get(a.type) ?? 0) + 1);
  }
  const weekSessionTypes = Array.from(typeCount.entries())
    .map(([type, count]) => `${count}x ${type}`)
    .join(", ") || "ninguna";

  // Last activity
  const lastAct = allActivities[allActivities.length - 1] ?? null;
  const msPerDay = 1000 * 60 * 60 * 24;
  const lastActDateStr = lastAct ? actLocalStr(lastAct.date, tz) : null;
  const daysAgo = lastActDateStr
    ? Math.round(
        (new Date(todayStr).getTime() - new Date(lastActDateStr).getTime()) /
          msPerDay,
      )
    : 999;

  const lastActivity = lastAct
    ? {
        date: lastAct.date.toISOString().split("T")[0]!,
        name: lastAct.name,
        type: lastAct.type,
        km: mToKm(lastAct.distanceM),
        pace: secToPace(lastAct.paceSeckm),
        avgHR: lastAct.avgHRbpm,
        tss: lastAct.tss ?? (lastAct.avgHRbpm ? Math.round(calculateRunTSS(lastAct.durationSec, lastAct.avgHRbpm, thresholdHR)) : null),
        daysAgo,
      }
    : null;

  // Consecutive run days (looking back from yesterday in user's timezone)
  const activeDays = new Set(allActivities.map((a) => actLocalStr(a.date, tz)));
  let consecutiveRunDays = 0;
  const [cty, ctm, ctd] = todayStr.split("-").map(Number);
  const checkCursor = new Date(Date.UTC(cty!, ctm! - 1, ctd! - 1));
  while (activeDays.has(checkCursor.toISOString().split("T")[0]!)) {
    consecutiveRunDays++;
    checkCursor.setUTCDate(checkCursor.getUTCDate() - 1);
  }

  const rCtl = Math.round(ctl);
  const rAtl = Math.round(atl);
  const rTsb = Math.round(tsb);

  const goal = await buildGoalContext(userId, rCtl, rAtl, tz);
  const overttrainingRisk = assessOverttrainingRisk(rCtl, rAtl, rTsb, consecutiveRunDays);

  return {
    userName: user.name,
    maxHR: user.maxHR,
    thresholdHR,
    todayDate: todayStr,
    dayOfWeek,
    ctl: rCtl,
    atl: rAtl,
    tsb: rTsb,
    tsbTrend,
    weekSessionsCount: thisWeekActs.length,
    weeklyKm,
    weeklyTSS,
    weekSessionTypes,
    daysSinceLastRun: daysAgo,
    lastActivity,
    consecutiveRunDays,
    goal,
    overttrainingRisk,
  };
}

// ─── Long run recovery helper ─────────────────────────────────────────────────

type ActivitySlim = {
  date: Date;
  type: string;
  distanceM: number;
  durationSec: number;
  paceSeckm: number;
  avgHRbpm: number | null;
  tss: number | null;
};

function buildLongRunRecovery(
  activities: ActivitySlim[],
  thresholdHR: number,
): LongRunRecovery | null {
  const MS_PER_DAY = 86_400_000;
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * MS_PER_DAY);

  // Most recent long run in the last 30 days
  const longRuns = activities.filter(
    (a) => a.type === "long" && a.date >= thirtyDaysAgo,
  );
  if (longRuns.length === 0) return null;

  const lastLong = longRuns[longRuns.length - 1]!;
  const daysSince = Math.floor((now.getTime() - lastLong.date.getTime()) / MS_PER_DAY);

  // Activities in the 7 days after the long run (excluding the long run itself)
  const sevenDaysAfter = new Date(lastLong.date.getTime() + 7 * MS_PER_DAY);
  const recoveryActs = activities.filter(
    (a) => a.date > lastLong.date && a.date <= sevenDaysAfter,
  );

  return {
    longRunDate: lastLong.date.toISOString().split("T")[0]!,
    longRunKm: mToKm(lastLong.distanceM),
    daysSinceLongRun: daysSince,
    recoveryDays: recoveryActs.map((a) => {
      const daysAfter = Math.round((a.date.getTime() - lastLong.date.getTime()) / MS_PER_DAY);
      const tss = a.tss ?? (a.avgHRbpm ? Math.round(calculateRunTSS(a.durationSec, a.avgHRbpm, thresholdHR)) : null);
      return {
        daysAfter,
        km: mToKm(a.distanceM),
        pace: secToPace(a.paceSeckm),
        avgHR: a.avgHRbpm,
        tss,
      };
    }),
  };
}

export async function buildWeeklyContext(userId: string, tz = "UTC"): Promise<WeeklyContext> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  const thresholdHR = user.maxHR ? estimateThresholdHR(user.maxHR) : 160;

  // All activities for CTL/ATL
  const allActivities = await prisma.activity.findMany({
    where: { userId },
    orderBy: { date: "asc" },
    select: {
      date: true,
      type: true,
      durationSec: true,
      distanceM: true,
      paceSeckm: true,
      avgHRbpm: true,
      tss: true,
      name: true,
      feel: true,
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

  // This week boundaries (Mon–Sun) in the user's timezone
  const now = new Date();
  const weekStartStr = localWeekStartStr(tz);
  const [wsy, wsm, wsd] = weekStartStr.split("-").map(Number);
  const weekEndStr      = new Date(Date.UTC(wsy!, wsm! - 1, wsd! + 6)).toISOString().split("T")[0]!;
  const prevWeekStartStr = new Date(Date.UTC(wsy!, wsm! - 1, wsd! - 7)).toISOString().split("T")[0]!;
  const prevWeekEndStr   = new Date(Date.UTC(wsy!, wsm! - 1, wsd! - 1)).toISOString().split("T")[0]!;

  const thisWeekActs = allActivities.filter((a) => {
    const d = actLocalStr(a.date, tz);
    return d >= weekStartStr && d <= weekEndStr;
  });
  const prevWeekActs = allActivities.filter((a) => {
    const d = actLocalStr(a.date, tz);
    return d >= prevWeekStartStr && d <= prevWeekEndStr;
  });

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

  // Last 3 activities (dates in user's timezone)
  const recentActivities = allActivities
    .slice(-3)
    .reverse()
    .map((a) => ({
      date: actLocalStr(a.date, tz),
      name: a.name,
      km: mToKm(a.distanceM),
      pace: secToPace(a.paceSeckm),
      avgHR: a.avgHRbpm,
      feel: a.feel ?? null,
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

  const rCtl = Math.round(ctl);
  const rAtl = Math.round(atl);
  const rTsb = Math.round(tsb);

  const goal = await buildGoalContext(userId, rCtl, rAtl, tz);
  const overttrainingRisk = assessOverttrainingRisk(rCtl, rAtl, rTsb, 0); // weekly doesn't track consecutive days
  const longRunRecovery = buildLongRunRecovery(allActivities, thresholdHR);

  return {
    userName: user.name,
    maxHR: user.maxHR,
    thresholdHR,
    ctl: rCtl,
    atl: rAtl,
    tsb: rTsb,
    tsbTrend,
    weekStart: weekStartStr,
    weekEnd: weekEndStr,
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
    goal,
    overttrainingRisk,
    longRunRecovery,
  };
}
