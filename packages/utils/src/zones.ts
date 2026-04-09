import { hrZone } from "./format";

export interface ZoneDistribution {
  z1: number; // minutes in zone 1
  z2: number;
  z3: number;
  z4: number;
  z5: number;
}

export interface ActivityForZones {
  durationSec: number;
  avgHRbpm: number | null;
}

/**
 * Estimates zone distribution from a list of activities.
 * Uses avgHR as a proxy — assumes the entire activity was at avgHR.
 * More accurate with per-second stream data (future enhancement).
 */
export function zoneDistribution(
  activities: ActivityForZones[],
  maxHR: number,
): ZoneDistribution {
  const result: ZoneDistribution = { z1: 0, z2: 0, z3: 0, z4: 0, z5: 0 };

  for (const act of activities) {
    if (act.avgHRbpm == null) continue;
    const zone = hrZone(act.avgHRbpm, maxHR);
    const minutes = act.durationSec / 60;
    result[`z${zone}` as keyof ZoneDistribution] += minutes;
  }

  // Round to 1 decimal
  for (const key of Object.keys(result) as (keyof ZoneDistribution)[]) {
    result[key] = Math.round(result[key] * 10) / 10;
  }

  return result;
}
