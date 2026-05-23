import { hrZone } from "./format";

/**
 * Converts avgHR as a % of maxHR to a 1–5 RPE scale aligned with HR zones.
 * Z1 (<60%) → 1, Z2 (60–70%) → 2, Z3 (70–80%) → 3, Z4 (80–90%) → 4, Z5 (≥90%) → 5
 * Returns null if either argument is missing or invalid.
 */
export function calculateFeel(
  avgHRbpm: number | null | undefined,
  maxHR: number | null | undefined,
): 1 | 2 | 3 | 4 | 5 | null {
  if (!avgHRbpm || !maxHR || maxHR <= 0) return null;
  const zone = hrZone(avgHRbpm, maxHR);
  return zone as 1 | 2 | 3 | 4 | 5;
}

const FEEL_LABELS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: "Muy fácil",
  2: "Fácil",
  3: "Moderado",
  4: "Duro",
  5: "Máximo",
};

/** Returns the Spanish label for a 1–5 feel score. */
export function feelLabel(feel: 1 | 2 | 3 | 4 | 5): string {
  return FEEL_LABELS[feel];
}

/** Returns a hex color for a 1–5 feel score for use in the UI. */
export function feelColor(feel: 1 | 2 | 3 | 4 | 5): string {
  const colors: Record<1 | 2 | 3 | 4 | 5, string> = {
    1: "#60a5fa", // blue  — Muy fácil
    2: "#4ade80", // green — Fácil
    3: "#facc15", // yellow — Moderado
    4: "#fb923c", // orange — Duro
    5: "#ef4444", // red   — Máximo
  };
  return colors[feel];
}

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
