"use client";

import { useState, useEffect, useCallback } from "react";

export interface CoachInsights {
  summary: string;
  positive: { title: string; body: string };
  warning: { title: string; body: string };
  tip: { title: string; body: string };
  prediction: { title: string; body: string };
}

export function useCoachStream() {
  const [insights, setInsights] = useState<CoachInsights | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = useCallback(async (invalidateCache = false) => {
    setIsLoading(true);
    setError(null);
    setInsights(null);

    const url = invalidateCache
      ? "/api/coach/weekly?refresh=1"
      : "/api/coach/weekly";

    try {
      const res = await fetch(url);
      const json = await res.json();

      if (!res.ok || json.error) {
        setError(json.error ?? "Error al obtener análisis del coach");
        return;
      }

      setInsights(json as CoachInsights);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  return {
    insights,
    isLoading,
    error,
    refetch: () => fetchInsights(true),
  };
}
