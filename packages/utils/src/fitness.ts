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

export function calculateFitness(
  dailyLoads: DailyLoad[],
  initialCtl = 0,
  initialAtl = 0,
): FitnessPoint[] {
  const TAU_CTL = 42;
  const TAU_ATL = 7;

  const sorted = [...dailyLoads].sort((a, b) => a.date.localeCompare(b.date));
  const result: FitnessPoint[] = [];

  let ctl = initialCtl;
  let atl = initialAtl;

  for (const { date, tss } of sorted) {
    ctl = ctl + (tss - ctl) / TAU_CTL;
    atl = atl + (tss - atl) / TAU_ATL;
    result.push({
      date,
      ctl: round(ctl),
      atl: round(atl),
      tsb: round(ctl - atl),
    });
  }

  return result;
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

function round(n: number, decimals = 1): number {
  return Math.round(n * 10 ** decimals) / 10 ** decimals;
}
