import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { ActivityItem } from "@/hooks/useActivities";

export interface ActivityAnalysis {
  analysis?: string;
  highlights?: string[];
  suggestions?: string[];
  // The coach/activity endpoint returns JSON with variable shape
  [key: string]: unknown;
}

export function useActivityDetail(id: string) {
  const activityQuery = useQuery({
    queryKey: ["activity", id],
    queryFn: () => apiFetch<ActivityItem>(`/api/activities/${id}`),
    staleTime: 10 * 60 * 1000,
    enabled: !!id,
  });

  const analysisQuery = useQuery({
    queryKey: ["activity-analysis", id],
    queryFn: () => apiFetch<ActivityAnalysis>(`/api/coach/activity/${id}`),
    staleTime: 24 * 60 * 60 * 1000, // 24h — cached by backend too
    enabled: !!id,
  });

  return { activityQuery, analysisQuery };
}
