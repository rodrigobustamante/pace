"use client";

import { useState, useEffect, useCallback } from "react";

export interface CoachInsights {
  summary: string;
  positive: { title: string; body: string };
  warning: { title: string; body: string };
  tip: { title: string; body: string };
  prediction: { title: string; body: string };
  complementary?: { title: string; body: string };
}

type SSEEvent =
  | { type: "chunk"; text: string }
  | { type: "done"; result: CoachInsights }
  | { type: "error"; message: string };

/** Extracts the partial summary text from a mid-stream JSON buffer. */
function extractPartialSummary(raw: string): string {
  const match = raw.match(/"summary"\s*:\s*"((?:[^"\\]|\\.)*)/) ;
  return match?.[1]?.replace(/\\n/g, " ").replace(/\\"/g, '"') ?? "";
}

export function useCoachStream() {
  const [insights, setInsights] = useState<CoachInsights | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamSummary, setStreamSummary] = useState("");
  const [wasStreamed, setWasStreamed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = useCallback(async (invalidateCache = false) => {
    setIsLoading(true);
    setIsStreaming(false);
    setStreamSummary("");
    setWasStreamed(false);
    setError(null);
    setInsights(null);

    const url = invalidateCache ? "/api/coach/weekly?refresh=1" : "/api/coach/weekly";
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    try {
      const res = await fetch(url, {
        headers: { "X-User-Timezone": tz },
      });

      if (!res.body) {
        setError("Respuesta vacía del servidor");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let streaming = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Split on double newlines (SSE event boundaries)
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data: ")) continue;

          let event: SSEEvent;
          try {
            event = JSON.parse(line.slice(6)) as SSEEvent;
          } catch {
            continue;
          }

          if (event.type === "chunk") {
            if (!streaming) {
              streaming = true;
              setIsStreaming(true);
            }
            setStreamSummary((prev) => {
              const accumulated = prev + event.text;
              return extractPartialSummary(accumulated) ? accumulated : prev + event.text;
            });
          } else if (event.type === "done") {
            setInsights(event.result);
            setWasStreamed(streaming);
            setIsStreaming(false);
            streaming = false;
          } else if (event.type === "error") {
            setError(event.message);
            setIsStreaming(false);
            streaming = false;
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  }, []);

  useEffect(() => {
    void fetchInsights();
  }, [fetchInsights]);

  return {
    insights,
    isLoading,
    /** True while Gemini tokens are actively arriving */
    isStreaming,
    /** Partial summary text extracted from the live token stream */
    streamSummary: extractPartialSummary(streamSummary),
    /** True if the current insights were generated live (not from cache) */
    wasStreamed,
    error,
    refetch: () => fetchInsights(true),
  };
}
