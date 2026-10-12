export interface DailyLoad {
  date: string; // YYYY-MM-DD
  tss: number;
}

export interface FitnessPoint {
  date: string;
  ctl: number; // Chronic Training Load (Fitness), τ=42 days
  atl: number; // Acute Training Load (Fatigue), τ=7 days
  tsb: number; // Training Stress Balance (Form = Fitness - Fatigue)
}

/**
 * Banister impulse-response model over a daily TSS series.
 *
 * The EWMA advances one step per calendar day: days without a load in
 * `dailyLoads` (rest days, gaps between activities) count as TSS 0, so CTL and
 * ATL decay through them. Pass `until` (YYYY-MM-DD) to keep decaying past the
 * last activity up to that day, e.g. today, so the latest point is current.
 */
export function calculateFitness(
  dailyLoads: DailyLoad[],
  initialCtl = 0,
  initialAtl = 0,
  until?: string,
): FitnessPoint[] {
  const TAU_CTL = 42;
  const TAU_ATL = 7;

  const tssByDate = new Map<string, number>();
  for (const { date, tss } of dailyLoads) {
    tssByDate.set(date, (tssByDate.get(date) ?? 0) + tss);
  }
  const dates = [...tssByDate.keys()].sort();
  const result: FitnessPoint[] = [];
  if (dates.length === 0) return result;

  const first = dates[0]!;
  const last = until && until > dates[dates.length - 1]! ? until : dates[dates.length - 1]!;

  let ctl = initialCtl;
  let atl = initialAtl;

  for (let day = first; day <= last; day = nextDay(day)) {
    const tss = tssByDate.get(day) ?? 0;
    ctl = ctl + (tss - ctl) / TAU_CTL;
    atl = atl + (tss - atl) / TAU_ATL;
    result.push({
      date: day,
      ctl: round(ctl),
      atl: round(atl),
      tsb: round(ctl - atl),
    });
  }

  return result;
}

function nextDay(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d! + 1)).toISOString().split("T")[0]!;
}

// HR-based running TSS (simplified Skiba method)
export function calculateRunTSS(
  durationSec: number,
  avgHR: number,
  thresholdHR: number,
): number {
  const intensityFactor = avgHR / thresholdHR;
  const tss =
    ((durationSec * avgHR * intensityFactor) / (thresholdHR * 3600)) * 100;
  return round(tss);
}

// Estimated threshold HR when no lactate test is available
export function estimateThresholdHR(maxHR: number): number {
  return Math.round(maxHR * 0.89);
}

// ─── Overtraining risk ────────────────────────────────────────────────────────

export type OverttrainingLevel = "ok" | "warning" | "danger";

export interface OverttrainingRisk {
  level: OverttrainingLevel;
  signals: string[];
  atlCtlRatio: number;
}

/**
 * Assesses overtraining risk from fitness metrics.
 * Pure algorithmic — no AI involved.
 *
 * danger:  TSB < -30  |  ATL/CTL > 1.5  |  7+ consecutive days
 * warning: TSB < -20  |  ATL/CTL > 1.3  |  5+ consecutive days
 */
export function assessOverttrainingRisk(
  ctl: number,
  atl: number,
  tsb: number,
  consecutiveRunDays: number,
): OverttrainingRisk {
  const signals: string[] = [];
  const atlCtlRatio = ctl > 0 ? round(atl / ctl, 2) : 0;

  if (tsb <= -30) signals.push(`TSB ${tsb} — fatiga crítica`);
  else if (tsb <= -20) signals.push(`TSB ${tsb} — fatiga elevada`);

  if (atlCtlRatio > 1.5) signals.push(`Ratio ATL/CTL ${atlCtlRatio} — sobrecarga aguda`);
  else if (atlCtlRatio > 1.3) signals.push(`Ratio ATL/CTL ${atlCtlRatio} — carga aguda alta`);

  if (consecutiveRunDays >= 7) signals.push(`${consecutiveRunDays} días consecutivos sin descanso`);
  else if (consecutiveRunDays >= 5) signals.push(`${consecutiveRunDays} días seguidos de entrenamiento`);

  const isDanger =
    tsb <= -30 || atlCtlRatio > 1.5 || consecutiveRunDays >= 7;
  const isWarning =
    !isDanger && (tsb <= -20 || atlCtlRatio > 1.3 || consecutiveRunDays >= 5);

  return {
    level: isDanger ? "danger" : isWarning ? "warning" : "ok",
    signals,
    atlCtlRatio,
  };
}

// ─── Workout TSS estimation ───────────────────────────────────────────────────

/**
 * Intensity factors per workout type (fraction of threshold HR).
 * TSS formula: durationMin × IF² × 100 / 60
 */
const WORKOUT_IF: Record<string, number> = {
  easy:    0.75,
  long:    0.78,
  tempo:   0.90,
  workout: 0.95,
  race:    1.05,
  unknown: 0,    // rest day
};

export function estimateWorkoutTSS(workoutType: string, durationMin: number): number {
  const ifValue = WORKOUT_IF[workoutType] ?? 0.75;
  if (ifValue === 0 || durationMin === 0) return 0;
  return round((durationMin * ifValue * ifValue * 100) / 60);
}

// ─── Race day fitness projection ─────────────────────────────────────────────

export interface RaceProjection {
  projectedCTL: number;
  projectedATL: number;
  projectedTSB: number;
}

/**
 * Projects CTL/ATL/TSB on the race date by simulating planned workouts
 * day by day from today forward. Days without a planned workout use TSS = 0.
 */
export function projectFitnessToDate(
  currentCtl: number,
  currentAtl: number,
  fromDate: string,   // today (YYYY-MM-DD) — first day to simulate
  toDate: string,     // race day (YYYY-MM-DD)
  plannedWorkouts: Array<{ date: string; workoutType: string; durationMin: number }>,
): RaceProjection {
  const TAU_CTL = 42;
  const TAU_ATL = 7;
  const MS_PER_DAY = 86_400_000;

  const workoutTSSByDate = new Map(
    plannedWorkouts.map((w) => [w.date, estimateWorkoutTSS(w.workoutType, w.durationMin)]),
  );

  let ctl = currentCtl;
  let atl = currentAtl;

  const start = new Date(fromDate);
  const end   = new Date(toDate);

  for (let d = new Date(start); d <= end; d = new Date(d.getTime() + MS_PER_DAY)) {
    const dateStr = d.toISOString().split("T")[0]!;
    const tss = workoutTSSByDate.get(dateStr) ?? 0;
    ctl = ctl + (tss - ctl) / TAU_CTL;
    atl = atl + (tss - atl) / TAU_ATL;
  }

  return {
    projectedCTL: round(ctl),
    projectedATL: round(atl),
    projectedTSB: round(ctl - atl),
  };
}

function round(n: number, decimals = 1): number {
  return Math.round(n * 10 ** decimals) / 10 ** decimals;
}
