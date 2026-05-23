"use client";

import { useState } from "react";
import type { ModelInfo, AIProviderFamily } from "@/services/ai/provider";
import * as s from "@/styles/pagesShared.css";

const PROVIDER_LABEL: Record<AIProviderFamily, string> = {
  gemini: "Google",
  openai: "OpenAI",
  anthropic: "Anthropic",
};

const PROVIDER_ICON: Record<AIProviderFamily, string> = {
  gemini: "✦",
  openai: "⬡",
  anthropic: "◈",
};

const PROVIDER_BADGE_COLOR: Record<AIProviderFamily, string> = {
  gemini: "rgba(66,133,244,0.18)",
  openai: "rgba(16,163,127,0.18)",
  anthropic: "rgba(204,140,69,0.2)",
};

const PROVIDER_BADGE_TEXT: Record<AIProviderFamily, string> = {
  gemini: "#60a5fa",
  openai: "#34d399",
  anthropic: "#f59e0b",
};

interface Props {
  allModels: ModelInfo[];
  currentModel: string;
}

type SaveState = "idle" | "saving" | "saved" | "error";

export function ModelSelector({ allModels, currentModel }: Props) {
  const [selected, setSelected] = useState(currentModel);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  async function handleSelect(modelId: string) {
    const info = allModels.find((m) => m.id === modelId);
    if (!info?.available || modelId === selected) return;

    setSelected(modelId);
    setSaveState("saving");

    try {
      const res = await fetch("/api/user/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferredModel: modelId }),
      });
      if (!res.ok) throw new Error("save failed");
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
    } catch {
      setSaveState("error");
      setSelected(currentModel); // revert
      setTimeout(() => setSaveState("idle"), 3000);
    }
  }

  const feedbackText: Record<SaveState, string> = {
    idle: "",
    saving: "Guardando…",
    saved: "✓ Guardado",
    error: "Error al guardar. Intenta de nuevo.",
  };

  const feedbackColor: Record<SaveState, string> = {
    idle: "transparent",
    saving: "#94a3b8",
    saved: "#4ade80",
    error: "#f87171",
  };

  return (
    <div>
      <div className={s.modelGrid}>
        {allModels.map((m) => {
          const isActive = m.id === selected;
          const isDisabled = !m.available;
          const cardClass = [
            s.modelCard,
            isActive ? s.modelCardActive : "",
            isDisabled ? s.modelCardDisabled : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <button
              key={m.id}
              type="button"
              className={cardClass}
              onClick={() => void handleSelect(m.id)}
              disabled={isDisabled || saveState === "saving"}
              title={isDisabled ? `Requiere ${PROVIDER_LABEL[m.provider]}_API_KEY` : undefined}
            >
              <span className={s.modelIcon}>{PROVIDER_ICON[m.provider]}</span>
              <div className={s.modelCardBody}>
                <div className={s.modelName}>{m.name}</div>
                <div className={s.modelMeta}>
                  {isDisabled ? "API key no configurada" : m.id}
                </div>
              </div>
              <span
                className={s.modelBadge}
                style={{
                  background: PROVIDER_BADGE_COLOR[m.provider],
                  color: PROVIDER_BADGE_TEXT[m.provider],
                }}
              >
                {PROVIDER_LABEL[m.provider]}
              </span>
              {isActive && (
                <span style={{ color: "#f97316", fontSize: 12, marginLeft: 4 }}>
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div
        className={s.modelSaveFeedback}
        style={{ color: feedbackColor[saveState] }}
      >
        {feedbackText[saveState]}
      </div>
    </div>
  );
}
