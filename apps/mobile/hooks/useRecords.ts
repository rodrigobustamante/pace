import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface PRRecord {
  distance: "5K" | "10K" | "21K" | "42K";
  distanceKm: number;
  timeSec: number;
  timeFormatted: string;
  pace: string;
  date: string;
  activityName: string;
  activityId: string;
}

export interface LongestRun {
  km: number;
  date: string;
  activityName: string;
  activityId: string;
}

export interface RecordsResponse {
  records: (PRRecord | null)[];
  longestRun: LongestRun | null;
}

export function useRecords() {
  return useQuery({
    queryKey: ["metrics", "records"],
    queryFn: () => apiFetch<RecordsResponse>("/api/metrics/records"),
    staleTime: 12 * 60 * 60 * 1000, // 12h
  });
}
