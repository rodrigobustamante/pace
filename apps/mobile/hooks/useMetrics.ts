import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface FitnessPoint {
  date: string;
  ctl: number;
  atl: number;
  tsb: number;
  tss: number;
}

export interface WeeklyPoint {
  week: string;
  km: number;
  tss: number;
  avgPace: number;
  avgPaceFormatted: string;
  avgHR: number;
  sessions: number;
}

export interface ZoneMinutes {
  z1: number;
  z2: number;
  z3: number;
  z4: number;
  z5: number;
}

export interface MetricsResponse {
  fitness: FitnessPoint[];
  weeklyData: WeeklyPoint[];
  zones: ZoneMinutes | null;
  maxHR: number | null;
  streaks: { currentStreak: number; longestStreak: number };
  annualStats: {
    totalKm: number;
    totalRuns: number;
    activeDays: number;
    totalElevationM: number;
    avgWeeklyKm: number;
  };
}

export function useMetrics() {
  return useQuery({
    queryKey: ["metrics"],
    queryFn: () => apiFetch<MetricsResponse>("/api/metrics"),
    staleTime: 5 * 60 * 1000,
  });
}
