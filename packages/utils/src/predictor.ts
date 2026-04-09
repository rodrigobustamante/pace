import { predictRaceTime } from "./format";
import { secToDuration } from "./format";

export interface RacePrediction {
  distance: string;
  distanceM: number;
  predictedTimeSec: number;
  predictedTimeFormatted: string;
}

export interface ActivityForPrediction {
  distanceM: number;
  durationSec: number;
}

const RACE_DISTANCES: { label: string; meters: number }[] = [
  { label: "5K", meters: 5000 },
  { label: "10K", meters: 10000 },
  { label: "21K", meters: 21097 },
  { label: "42K", meters: 42195 },
];

/**
 * Picks the best "effort" activity (closest in distance to a target)
 * from the recent activity list and applies Riegel formula.
 */
export function predictAllRaces(
  activities: ActivityForPrediction[],
): RacePrediction[] {
  // Use the best recent activity (longest distance with valid duration)
  const best = activities
    .filter((a) => a.distanceM > 3000 && a.durationSec > 0)
    .sort((a, b) => b.distanceM - a.distanceM)[0];

  if (!best) return [];

  return RACE_DISTANCES.map(({ label, meters }) => {
    const predictedTimeSec = predictRaceTime(
      best.durationSec,
      best.distanceM,
      meters,
    );
    return {
      distance: label,
      distanceM: meters,
      predictedTimeSec,
      predictedTimeFormatted: secToDuration(predictedTimeSec),
    };
  });
}
