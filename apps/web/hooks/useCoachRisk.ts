"use client";

import { useQuery } from "@tanstack/react-query";
import type { OverttrainingRisk, RaceProjection } from "@/services/coach/context";

interface CoachRiskResponse {
  overttrainingRisk: OverttrainingRisk;
  raceProjection: {
    goalTitle: string;
    targetDate: string;
    daysUntilRace: number;
    projection: RaceProjection | null;
  } | null;
}

export function useCoachRisk() {
  const { data, isLoading, error, refetch } = useQuery<CoachRiskResponse>({
    queryKey: ["coach-risk"],
    queryFn: async () => {
      const res = await fetch("/api/coach/risk");
      if (!res.ok) throw new Error("Error cargando señales del coach");
      return res.json() as Promise<CoachRiskResponse>;
    },
    staleTime: 1000 * 60 * 30, // 30 min
  });

  return {
    risk: data?.overttrainingRisk ?? null,
    raceProjection: data?.raceProjection ?? null,
    isLoading,
    error: error instanceof Error ? error.message : null,
    refetch: () => refetch(),
  };
}
