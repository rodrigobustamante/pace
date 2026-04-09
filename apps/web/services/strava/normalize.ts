import type { Prisma, RunType } from "@pace/db";

export function normalizeActivity(
  raw: Record<string, unknown>,
  userId: string,
): Prisma.ActivityCreateInput {
  return {
    stravaId: BigInt(raw.id as number),
    user: { connect: { id: userId } },
    name: raw.name as string,
    type: inferRunType(raw),
    date: new Date(raw.start_date as string),
    distanceM: raw.distance as number,
    durationSec: raw.moving_time as number,
    paceSeckm:
      (raw.distance as number) > 0
        ? Math.round(
            (raw.moving_time as number) / ((raw.distance as number) / 1000),
          )
        : 0,
    avgHRbpm:
      raw.average_heartrate != null
        ? Math.round(raw.average_heartrate as number)
        : null,
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
  };
}

function inferRunType(raw: Record<string, unknown>): RunType {
  const name = ((raw.name as string) || "").toLowerCase();
  const workoutType = raw.workout_type as number | undefined;

  if (workoutType === 1) return "race";
  if (workoutType === 2) return "long";
  if (workoutType === 3) return "workout";
  if (
    name.includes("tempo") ||
    name.includes("interval") ||
    name.includes("fartlek")
  )
    return "tempo";
  if (name.includes("largo") || name.includes("long")) return "long";
  if (
    name.includes("recup") ||
    name.includes("easy") ||
    name.includes("fácil")
  )
    return "easy";
  return "easy";
}
