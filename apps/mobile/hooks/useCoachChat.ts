import { useState, useCallback, useRef } from "react";
import { apiStream } from "@/lib/api";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

export function useCoachChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const conversationIdRef = useRef(
    `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );

  const send = useCallback(
    async (userMessage: string) => {
      if (isStreaming || !userMessage.trim()) return;

      // Add user message + empty streaming assistant message
      setMessages((prev) => [
        ...prev,
        { role: "user", content: userMessage },
        { role: "assistant", content: "", streaming: true },
      ]);
      setIsStreaming(true);

      try {
        const res = await apiStream("/api/coach/chat", {
          method: "POST",
          body: JSON.stringify({
            message: userMessage,
            conversationId: conversationIdRef.current,
          }),
        });

        if (!res.body) throw new Error("No response body");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });

          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last?.role === "assistant") {
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
          if (last?.role === "assistant") {
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
          if (last?.role === "assistant") {
            next[next.length - 1] = { ...last, streaming: false };
          }
          return next;
        });
        setIsStreaming(false);
      }
    },
    [isStreaming],
  );

  const reset = useCallback(() => {
    conversationIdRef.current = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setMessages([]);
  }, []);

  return { messages, isStreaming, send, reset };
}
