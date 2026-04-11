"use client";

import { useState, useCallback, useRef } from "react";

export interface ChatMessage {
  role: "user" | "model";
  content: string;
  streaming?: boolean;
}

export function useCoachChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const conversationId = useRef(crypto.randomUUID());

  const send = useCallback(async (userMessage: string) => {
    if (isStreaming || !userMessage.trim()) return;

    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage },
      { role: "model", content: "", streaming: true },
    ]);
    setIsStreaming(true);

    try {
      const res = await fetch("/api/coach/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          conversationId: conversationId.current,
        }),
      });

      if (!res.ok || !res.body) {
        const json = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(json.error ?? "Error al conectar con el coach");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last?.role === "model") {
            next[next.length - 1] = { ...last, content: last.content + chunk };
          }
          return next;
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last?.role === "model") {
          next[next.length - 1] = { ...last, content: `Error: ${msg}`, streaming: false };
        }
        return next;
      });
    } finally {
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last?.role === "model") {
          next[next.length - 1] = { ...last, streaming: false };
        }
        return next;
      });
      setIsStreaming(false);
    }
  }, [isStreaming]);

  const reset = useCallback(() => {
    conversationId.current = crypto.randomUUID();
    setMessages([]);
  }, []);

  return { messages, isStreaming, send, reset };
}
