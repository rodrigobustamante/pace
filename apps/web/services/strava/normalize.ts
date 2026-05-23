import type { Prisma, RunType } from "@pace/db";
import { calculateFeel } from "@pace/utils";

export function normalizeActivity(
  raw: Record<string, unknown>,
  userId: string,
  maxHR?: number | null,
): Prisma.ActivityCreateInput {
  const avgHRbpm =
    raw.average_heartrate != null
      ? Math.round(raw.average_heartrate as number)
      : null;

  return {
    stravaId: BigInt(raw.id as number),
    user: { connect: { id: userId } },
    name: raw.name as string,
    type: inferRunType(raw, avgHRbpm, maxHR),
    date: new Date(raw.start_date as string),
    distanceM: raw.distance as number,
    durationSec: raw.moving_time as number,
    paceSeckm:
      (raw.distance as number) > 0
        ? Math.round(
            (raw.moving_time as number) / ((raw.distance as number) / 1000),
          )
        : 0,
    avgHRbpm,
    maxHRbpm:
      raw.max_heartrate != null
        ? Math.round(raw.max_heartrate as number)
        : null,
    // Strava returns spm (steps per minute) — multiply by 2 for strides/min
    cadenceRpm:
      raw.average_cadence != null
        ? Math.round((raw.average_cadence as number) * 2)
        : null,
    elevationM: raw.total_elevation_gain != null ? (raw.total_elevation_gain as number) : null,
    caloriesKcal: raw.calories != null ? (raw.calories as number) : null,
    stravaData: raw as Prisma.InputJsonValue,
    feel: calculateFeel(avgHRbpm, maxHR) ?? undefined,
  };
}

function inferRunType(
  raw: Record<string, unknown>,
  avgHRbpm?: number | null,
  maxHR?: number | null,
): RunType {
  const name = ((raw.name as string) || "").toLowerCase();
  const workoutType = raw.workout_type as number | undefined;

  // 1. Strava explicit workout type takes priority
  if (workoutType === 1) return "race";
  if (workoutType === 2) return "long";
  if (workoutType === 3) return "workout";

  // 2. Name-based keywords
  if (
    name.includes("tempo") ||
    name.includes("interval") ||
    name.includes("fartlek") ||
    name.includes("series")
  )
    return "tempo";
  if (name.includes("largo") || name.includes("long")) return "long";
  if (
    name.includes("recup") ||
    name.includes("easy") ||
    name.includes("fácil") ||
    name.includes("suave")
  )
    return "easy";

  // 3. HR-based fallback when name gives no signal
  if (avgHRbpm && maxHR && maxHR > 0) {
    const pct = avgHRbpm / maxHR;
    if (pct >= 0.9) return "workout"; // Z5 — race-pace / VO2max
    if (pct >= 0.8) return "workout"; // Z4 — threshold / intervals
    if (pct >= 0.7) return "tempo";   // Z3 — aerobic threshold
    return "easy";                    // Z1–Z2
  }

  return "easy";
}
