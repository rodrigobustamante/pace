"use client";

import {
  useRef,
  useEffect,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { useTranslations } from "next-intl";
import { useCoachChat, type ChatMessage } from "@/hooks/useCoachChat";
import * as cc from "@/styles/coachChat.css";

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

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";

  return (
    <div
      className={`${cc.bubbleRow} ${isUser ? cc.bubbleRowUser : cc.bubbleRowAssistant}`}
    >
      {!isUser && (
        <div className={cc.avatarBot}>🤖</div>
      )}
      <div
        className={`${cc.bubble} ${isUser ? cc.bubbleUser : cc.bubbleAssistant}`}
      >
        {isUser ? msg.content : renderMarkdown(msg.content)}
        {msg.streaming ? <span className={cc.caret} /> : null}
      </div>
    </div>
  );
}

export function CoachChat() {
  const t = useTranslations("coach");
  const suggestedQuestions = t.raw("suggestedQuestions") as string[];
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
  const sendDisabled = isStreaming || !input.trim();

  return (
    <div className={cc.root}>
      <div className={cc.header}>
        <div className={cc.headerLeft}>
          <span className={cc.headerTitle}>{t("chatPanelTitle")}</span>
          {isStreaming ? (
            <span className={cc.headerStatus}>{t("chatTyping")}</span>
          ) : null}
        </div>
        {!isEmpty ? (
          <button type="button" onClick={reset} className={cc.resetBtn}>
            {t("chatReset")}
          </button>
        ) : null}
      </div>

      <div className={cc.messages}>
        {isEmpty ? (
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
    </div>
  );
}
