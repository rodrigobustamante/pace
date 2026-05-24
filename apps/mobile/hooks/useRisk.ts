import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface RiskResponse {
  overttrainingRisk: {
    level: "ok" | "warning" | "danger";
    signals: string[];
    atlCtlRatio: number;
  };
  raceProjection: {
    goalTitle: string;
    targetDate: string;
    daysUntilRace: number;
    projection: {
      projectedCTL: number;
      projectedATL: number;
      projectedTSB: number;
    } | null;
  } | null;
}

export function useRisk() {
  return useQuery({
    queryKey: ["coach", "risk"],
    queryFn: () => apiFetch<RiskResponse>("/api/coach/risk"),
    staleTime: 60 * 60 * 1000, // 1h
  });
}
