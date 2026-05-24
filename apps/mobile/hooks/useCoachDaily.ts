import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface DailyRecommendation {
  recommendation: "train" | "rest";
  sessionType: "easy" | "tempo" | "long" | "workout" | null;
  title: string;
  body: string;
  duration: string | null;
  intensity: string | null;
}

function secsUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.floor((midnight.getTime() - now.getTime()) / 1000);
}

export function useCoachDaily() {
  return useQuery({
    queryKey: ["coach", "daily"],
    queryFn: () => apiFetch<DailyRecommendation>("/api/coach/daily"),
    staleTime: secsUntilMidnight() * 1000,
    gcTime: secsUntilMidnight() * 1000 + 60_000,
  });
}
