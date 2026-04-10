"use client";

import { useState, useEffect, useCallback } from "react";

export interface DailyAdvice {
  recommendation: "train" | "rest";
  sessionType: "easy" | "tempo" | "long" | "workout" | null;
  title: string;
  body: string;
  duration: string | null;
  intensity: string | null;
}

export function useDailyCoach() {
  const [advice, setAdvice] = useState<DailyAdvice | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAdvice = useCallback(async (invalidateCache = false) => {
    setIsLoading(true);
    setError(null);
    setAdvice(null);

    const url = invalidateCache ? "/api/coach/daily?refresh=1" : "/api/coach/daily";

    try {
      const res = await fetch(url);
      const json = await res.json();

      if (!res.ok || json.error) {
        setError(json.error ?? "Error al obtener consejo del día");
        return;
      }

      setAdvice(json as DailyAdvice);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdvice();
  }, [fetchAdvice]);

  return {
    advice,
    isLoading,
    error,
    refetch: () => fetchAdvice(true),
  };
}
