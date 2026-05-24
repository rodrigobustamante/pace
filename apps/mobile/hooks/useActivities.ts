import { useInfiniteQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { RunType } from "@pace/types";

export interface ActivityItem {
  id: string;
  name: string;
  type: RunType;
  date: string;
  distanceM: number;
  durationSec: number;
  paceSeckm: number;
  avgHRbpm: number | null;
  maxHRbpm: number | null;
  cadenceRpm: number | null;
  elevationM: number | null;
  caloriesKcal: number | null;
  tss: number | null;
  feel: number | null;
}

interface ActivitiesResponse {
  activities: ActivityItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function useActivities() {
  return useInfiniteQuery({
    queryKey: ["activities"],
    queryFn: ({ pageParam }) =>
      apiFetch<ActivitiesResponse>(`/api/activities?page=${pageParam}&limit=20`),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.pagination.page < last.pagination.totalPages
        ? last.pagination.page + 1
        : undefined,
    staleTime: 5 * 60 * 1000,
  });
}
