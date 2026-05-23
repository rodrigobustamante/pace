"use client";

import {
  useRef,
  useEffect,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { useTranslations } from "next-intl";
import { useCoachChat, type ChatMessage, type ConversationPreview } from "@/hooks/useCoachChat";
import * as cc from "@/styles/coachChat.css";

// ── Markdown renderer ────────────────────────────────────────────────────────

function renderMarkdown(text: string): ReactNode {
  const lines = text.split("\n");
  const nodes: ReactNode[] = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const trimmed = line.trim();

    if (/^[-*•]\s+/.test(trimmed)) {
      nodes.push(
        <div key={key++} className={cc.listRow}>
          <span className={cc.listBullet}>·</span>
          <span>{inlineMarkdown(trimmed.replace(/^[-*•]\s+/, ""), key++)}</span>
        </div>,
      );
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const match = trimmed.match(/^(\d+)\.\s+(.*)$/);
      if (match) {
        nodes.push(
          <div key={key++} className={cc.listRow}>
            <span className={cc.listNum}>{match[1]}.</span>
            <span>{inlineMarkdown(match[2]!, key++)}</span>
          </div>,
        );
        continue;
      }
    }

    if (trimmed === "") {
      if (nodes.length > 0) {
        nodes.push(<div key={key++} className={cc.spacer8} />);
      }
      continue;
    }

    nodes.push(<div key={key++}>{inlineMarkdown(line, key++)}</div>);
  }

  return <>{nodes}</>;
}

function inlineMarkdown(text: string, baseKey: number): ReactNode {
  const parts: ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(
        <span key={baseKey + i++}>{text.slice(last, match.index)}</span>,
      );
    }
    if (match[2] !== undefined) {
      parts.push(
        <strong key={baseKey + i++} className={cc.mdStrong}>
          {match[2]}
        </strong>,
      );
    } else if (match[3] !== undefined) {
      parts.push(
        <em key={baseKey + i++} className={cc.mdEm}>
          {match[3]}
        </em>,
      );
    } else if (match[4] !== undefined) {
      parts.push(
        <code key={baseKey + i++} className={cc.mdCode}>
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

// ── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";

  return (
    <div
      className={`${cc.bubbleRow} ${isUser ? cc.bubbleRowUser : cc.bubbleRowAssistant}`}
    >
      {!isUser && <div className={cc.avatarBot}>🤖</div>}
      <div
        className={`${cc.bubble} ${isUser ? cc.bubbleUser : cc.bubbleAssistant}`}
      >
        {isUser ? msg.content : renderMarkdown(msg.content)}
        {msg.streaming ? <span className={cc.caret} /> : null}
      </div>
    </div>
  );
}

// ── History panel ────────────────────────────────────────────────────────────

function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "Hoy";
  if (days === 1) return "Ayer";
  if (days < 7) return `Hace ${days} días`;
  if (days < 30) return `Hace ${Math.floor(days / 7)} sem`;
  return `Hace ${Math.floor(days / 30)} mes`;
}

interface HistoryPanelProps {
  currentConversationId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
}

function HistoryPanel({ currentConversationId, onSelect, onNew }: HistoryPanelProps) {
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/coach/conversations")
      .then((r) => r.json())
      .then((data: { conversations?: ConversationPreview[] }) => {
        if (!cancelled) setConversations(data.conversations ?? []);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className={cc.historyPanel}>
        <div className={cc.historyLoadingRow}>
          <span>Cargando historial…</span>
        </div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className={cc.historyPanel}>
        <div className={cc.historyEmpty}>Sin conversaciones anteriores</div>
      </div>
    );
  }

  return (
    <div className={cc.historyPanel}>
      {conversations.map((c) => {
        const isActive = c.conversationId === currentConversationId;
        return (
          <button
            key={c.conversationId}
            type="button"
            className={`${cc.historyItem} ${isActive ? cc.historyItemActive : ""}`}
            onClick={() => onSelect(c.conversationId)}
          >
            <span className={cc.historyItemPreview}>
              {c.preview}{c.preview.length >= 60 ? "…" : ""}
            </span>
            <span className={cc.historyItemMeta}>
              {relativeDate(c.updatedAt)} · {c.messageCount} mensajes
            </span>
          </button>
        );
      })}

      <button type="button" className={cc.historyItem} onClick={onNew}>
        <span className={cc.historyItemPreview} style={{ color: "#f97316" }}>
          + Nueva conversación
        </span>
      </button>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export function CoachChat() {
  const t = useTranslations("coach");
  const suggestedQuestions = t.raw("suggestedQuestions") as string[];
  const {
    messages,
    isStreaming,
    isLoadingHistory,
    currentConversationId,
    send,
    startNew,
    loadConversation,
  } = useCoachChat();
  const [input, setInput] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!showHistory) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, showHistory]);

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

  function handleSelectConversation(id: string) {
    void loadConversation(id);
    setShowHistory(false);
  }

  function handleNew() {
    startNew();
    setShowHistory(false);
  }

  const isEmpty = messages.length === 0 && !isLoadingHistory;
  const sendDisabled = isStreaming || isLoadingHistory || !input.trim();

  return (
    <div className={cc.root}>
      {/* ── Header ── */}
      <div className={cc.header}>
        <div className={cc.headerLeft}>
          <span className={cc.headerTitle}>{t("chatPanelTitle")}</span>
          {isStreaming && (
            <span className={cc.headerStatus}>{t("chatTyping")}</span>
          )}
          {isLoadingHistory && (
            <span className={cc.headerStatus}>Cargando…</span>
          )}
        </div>
        <div className={cc.headerLeft}>
          <button
            type="button"
            className={`${cc.historyBtn} ${showHistory ? cc.historyBtnActive : ""}`}
            onClick={() => setShowHistory((v) => !v)}
          >
            {showHistory ? "✕ Cerrar" : "📋 Historial"}
          </button>
          {!showHistory && (
            <button type="button" onClick={handleNew} className={cc.resetBtn}>
              {t("chatReset")}
            </button>
          )}
        </div>
      </div>

      {/* ── History panel or messages ── */}
      {showHistory ? (
        <HistoryPanel
          currentConversationId={currentConversationId}
          onSelect={handleSelectConversation}
          onNew={handleNew}
        />
      ) : (
        <div className={cc.messages}>
          {isLoadingHistory ? (
            <div className={cc.historyLoadingRow}>
              <span>Cargando conversación…</span>
            </div>
          ) : isEmpty ? (
            <div className={cc.emptyWrap}>
              <div className={cc.emptyHint}>{t("chatEmptyHint")}</div>
              <div className={cc.suggestedCol}>
                {suggestedQuestions.map((q) => (
                  <button
                    key={q}
                    type="button"
                    className={cc.suggestedBtn}
                    onClick={() => {
                      setInput(q);
                      inputRef.current?.focus();
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
      )}

      {/* ── Input bar (hidden while history panel is open) ── */}
      {!showHistory && (
        <div className={cc.inputBar}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("chatPlaceholder")}
            rows={1}
            className={cc.textarea}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={sendDisabled}
            className={`${cc.sendBtn} ${sendDisabled ? cc.sendBtnDisabled : cc.sendBtnActive}`}
          >
            ↑
          </button>
        </div>
      )}
    </div>
  );
}
