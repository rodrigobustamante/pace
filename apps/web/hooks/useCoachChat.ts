"use client";

import { useState, useCallback, useRef } from "react";

export interface ChatMessage {
  role: "user" | "model";
  content: string;
  streaming?: boolean;
}

export interface ConversationPreview {
  conversationId: string;
  preview: string;
  updatedAt: string;
  messageCount: number;
}

export function useCoachChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string>(
    () => crypto.randomUUID(),
  );
  // Ref mirrors state so closures inside send() always see the latest value
  const conversationIdRef = useRef(currentConversationId);

  const startNew = useCallback(() => {
    const id = crypto.randomUUID();
    conversationIdRef.current = id;
    setCurrentConversationId(id);
    setMessages([]);
  }, []);

  const loadConversation = useCallback(async (id: string) => {
    conversationIdRef.current = id;
    setCurrentConversationId(id);
    setMessages([]);
    setIsLoadingHistory(true);
    try {
      const res = await fetch(`/api/coach/conversations?id=${encodeURIComponent(id)}`);
      if (!res.ok) return;
      const data = (await res.json()) as {
        messages: Array<{ role: string; content: string }>;
      };
      setMessages(
        data.messages.map((m) => ({
          role: m.role as "user" | "model",
          content: m.content,
        })),
      );
    } catch {
      // silent — best-effort history load
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  const send = useCallback(
    async (userMessage: string) => {
      if (isStreaming || !userMessage.trim()) return;

      setMessages((prev) => [
        ...prev,
        { role: "user", content: userMessage },
        { role: "model", content: "", streaming: true },
      ]);
      setIsStreaming(true);

      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const res = await fetch("/api/coach/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-User-Timezone": tz,
          },
          body: JSON.stringify({
            message: userMessage,
            conversationId: conversationIdRef.current,
          }),
        });

        if (!res.ok || !res.body) {
          const json = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
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
              next[next.length - 1] = {
                ...last,
                content: last.content + chunk,
              };
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
            next[next.length - 1] = {
              ...last,
              content: `Error: ${msg}`,
              streaming: false,
            };
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
    },
    [isStreaming],
  );

  return {
    messages,
    isStreaming,
    isLoadingHistory,
    currentConversationId,
    send,
    /** Reset alias kept for backward compatibility */
    reset: startNew,
    startNew,
    loadConversation,
  };
}
