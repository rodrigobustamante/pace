"use client";

import { useRef, useEffect, useState, type KeyboardEvent, type ReactNode } from "react";
import { useCoachChat, type ChatMessage } from "@/hooks/useCoachChat";

/** Renders a markdown string into React nodes.
 *  Handles: **bold**, *italic*, `code`, bullet lists (- / *), numbered lists, line breaks. */
function renderMarkdown(text: string): ReactNode {
  const lines = text.split("\n");
  const nodes: ReactNode[] = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const trimmed = line.trim();

    // Bullet list item
    if (/^[-*•]\s+/.test(trimmed)) {
      nodes.push(
        <div key={key++} style={{ display: "flex", gap: 6, marginBottom: 3 }}>
          <span style={{ color: "#fb923c", flexShrink: 0, marginTop: 1 }}>·</span>
          <span>{inlineMarkdown(trimmed.replace(/^[-*•]\s+/, ""), key++)}</span>
        </div>,
      );
      continue;
    }

    // Numbered list item
    if (/^\d+\.\s+/.test(trimmed)) {
      const match = trimmed.match(/^(\d+)\.\s+(.*)$/);
      if (match) {
        nodes.push(
          <div key={key++} style={{ display: "flex", gap: 6, marginBottom: 3 }}>
            <span style={{ color: "#fb923c", flexShrink: 0, fontWeight: 700, minWidth: 14 }}>{match[1]}.</span>
            <span>{inlineMarkdown(match[2]!, key++)}</span>
          </div>,
        );
        continue;
      }
    }

    // Empty line → spacing
    if (trimmed === "") {
      if (nodes.length > 0) {
        nodes.push(<div key={key++} style={{ height: 8 }} />);
      }
      continue;
    }

    // Normal paragraph line
    nodes.push(<div key={key++}>{inlineMarkdown(line, key++)}</div>);
  }

  return <>{nodes}</>;
}

/** Parses inline markdown: **bold**, *italic*, `code` */
function inlineMarkdown(text: string, baseKey: number): ReactNode {
  const parts: ReactNode[] = [];
  // Pattern: **bold** | *italic* | `code`
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(<span key={baseKey + i++}>{text.slice(last, match.index)}</span>);
    }
    if (match[2] !== undefined) {
      parts.push(<strong key={baseKey + i++} style={{ color: "#f1f5f9", fontWeight: 700 }}>{match[2]}</strong>);
    } else if (match[3] !== undefined) {
      parts.push(<em key={baseKey + i++} style={{ color: "#cbd5e1", fontStyle: "italic" }}>{match[3]}</em>);
    } else if (match[4] !== undefined) {
      parts.push(
        <code key={baseKey + i++} style={{ background: "rgba(255,255,255,0.08)", borderRadius: 4, padding: "1px 5px", fontSize: 12, fontFamily: "'DM Mono', monospace", color: "#fb923c" }}>
          {match[4]}
        </code>,
      );
    }
    last = match.index + match[0].length;
  }

  if (last < text.length) {
    parts.push(<span key={baseKey + i++}>{text.slice(last)}</span>);
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

const SUGGESTED_QUESTIONS = [
  "¿Debería aumentar el volumen esta semana?",
  "¿Cómo está mi forma actual?",
  "¿Cuándo puedo hacer un entrenamiento de calidad?",
  "¿Qué ritmo debería llevar en mi próximo fondo?",
];

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: 12,
      }}
    >
      {!isUser && (
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "rgba(249,115,22,0.15)",
            border: "1px solid rgba(249,115,22,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            flexShrink: 0,
            marginRight: 10,
            marginTop: 2,
          }}
        >
          🤖
        </div>
      )}
      <div
        style={{
          maxWidth: "75%",
          padding: "10px 14px",
          borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
          background: isUser
            ? "rgba(249,115,22,0.15)"
            : "rgba(255,255,255,0.04)",
          border: isUser
            ? "1px solid rgba(249,115,22,0.25)"
            : "1px solid rgba(255,255,255,0.08)",
          fontSize: 13,
          lineHeight: 1.65,
          color: isUser ? "#fed7aa" : "#cbd5e1",
          wordBreak: "break-word",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {isUser ? msg.content : renderMarkdown(msg.content)}
        {msg.streaming && (
          <span
            style={{
              display: "inline-block",
              width: 2,
              height: 13,
              background: "#fb923c",
              marginLeft: 2,
              verticalAlign: "middle",
              animation: "blink 0.8s step-end infinite",
            }}
          />
        )}
      </div>
    </div>
  );
}

export function CoachChat() {
  const { messages, isStreaming, send, reset } = useCoachChat();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend() {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");
    void send(text);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const isEmpty = messages.length === 0;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: 480,
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>

      {/* Header */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#fb923c", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Chat con el coach
          </span>
          {isStreaming && (
            <span style={{ fontSize: 11, color: "#475569", fontFamily: "'DM Mono', monospace" }}>
              escribiendo...
            </span>
          )}
        </div>
        {!isEmpty && (
          <button
            onClick={reset}
            style={{
              background: "transparent",
              border: "none",
              color: "#334155",
              fontSize: 11,
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              padding: "2px 6px",
            }}
          >
            Nueva conversación
          </button>
        )}
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 16,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {isEmpty ? (
          <div style={{ margin: "auto", width: "100%", maxWidth: 360 }}>
            <div
              style={{
                textAlign: "center",
                color: "#334155",
                fontSize: 13,
                marginBottom: 20,
              }}
            >
              Pregúntame sobre tu entrenamiento
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    setInput(q);
                    inputRef.current?.focus();
                  }}
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 10,
                    padding: "10px 14px",
                    color: "#64748b",
                    fontSize: 12,
                    cursor: "pointer",
                    textAlign: "left",
                    fontFamily: "'DM Sans', sans-serif",
                    transition: "border-color 0.2s, color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(249,115,22,0.3)";
                    (e.currentTarget as HTMLButtonElement).style.color = "#94a3b8";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.07)";
                    (e.currentTarget as HTMLButtonElement).style.color = "#64748b";
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} />
            ))}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div
        style={{
          padding: "12px 16px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          gap: 8,
          flexShrink: 0,
        }}
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe tu pregunta... (Enter para enviar)"
          rows={1}
          style={{
            flex: 1,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 10,
            padding: "10px 12px",
            color: "#e2e8f0",
            fontSize: 13,
            fontFamily: "'DM Sans', sans-serif",
            resize: "none",
            outline: "none",
            lineHeight: 1.5,
          }}
        />
        <button
          onClick={handleSend}
          disabled={isStreaming || !input.trim()}
          style={{
            background: isStreaming || !input.trim()
              ? "rgba(255,255,255,0.04)"
              : "rgba(249,115,22,0.2)",
            border: isStreaming || !input.trim()
              ? "1px solid rgba(255,255,255,0.08)"
              : "1px solid rgba(249,115,22,0.4)",
            borderRadius: 10,
            padding: "0 16px",
            color: isStreaming || !input.trim() ? "#334155" : "#fb923c",
            fontSize: 18,
            cursor: isStreaming || !input.trim() ? "not-allowed" : "pointer",
            flexShrink: 0,
            transition: "all 0.2s",
          }}
        >
          ↑
        </button>
      </div>
    </div>
  );
}
