"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as s from "@/styles/planPage.css";

type GoalType = "race_5k" | "race_10k" | "half_marathon" | "marathon" | "custom";

const GOAL_ICONS: Record<GoalType, string> = {
  race_5k: "🏃",
  race_10k: "🏃",
  half_marathon: "🛣️",
  marathon: "🏆",
  custom: "🎯",
};

const PRIORITY_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  A: { color: "#f97316", bg: "rgba(249,115,22,0.15)", border: "rgba(249,115,22,0.4)" },
  B: { color: "#a78bfa", bg: "rgba(167,139,250,0.15)", border: "rgba(167,139,250,0.4)" },
  C: { color: "#64748b", bg: "rgba(100,116,139,0.15)", border: "rgba(100,116,139,0.4)" },
};

const PRIORITY_LABELS: Record<string, string> = {
  A: "A · Principal",
  B: "B · Secundaria",
  C: "C · Entrenamiento",
};

export interface MilestoneCardData {
  id: string;
  title: string;
  goalType: string;
  targetDate: string; // ISO
  location: string | null;
  priority: string;
}

interface Props {
  milestones: MilestoneCardData[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function daysUntil(isoDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(isoDate);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function MilestoneTimeline({ milestones, selectedId, onSelect }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (confirmId !== id) {
      setConfirmId(id);
      return;
    }
    setDeleting(id);
    setConfirmId(null);
    try {
      await fetch(`/api/goals/${id}`, { method: "DELETE" });
      router.refresh();
    } catch {
      setDeleting(null);
    }
  }

  function handleCardClick(id: string) {
    onSelect(id);
    // Cancel any pending confirm if clicking away
    if (confirmId && confirmId !== id) setConfirmId(null);
  }

  if (milestones.length === 0) {
    return (
      <div className={s.timelineEmpty}>
        Aún no has añadido ningún hito. Crea tu primera carrera con el botón de arriba.
      </div>
    );
  }

  return (
    <div className={s.timelineScroll}>
      {milestones.map((m) => {
        const isActive = m.id === selectedId;
        const isDel = deleting === m.id;
        const isConfirm = confirmId === m.id;
        const days = daysUntil(m.targetDate);
        const pCfg = PRIORITY_COLORS[m.priority] ?? PRIORITY_COLORS.A!;
        const icon = GOAL_ICONS[(m.goalType as GoalType)] ?? "🎯";

        return (
          <div
            key={m.id}
            className={`${s.milestoneCard} ${isActive ? s.milestoneCardActive : ""}`}
            onClick={() => handleCardClick(m.id)}
          >
            {/* Delete / confirm button */}
            <button
              className={s.milestoneDeleteBtn}
              onClick={(e) => handleDelete(e, m.id)}
              disabled={isDel}
              title={isConfirm ? "¿Confirmar eliminación?" : "Eliminar hito"}
              style={isConfirm ? { color: "#ef4444" } : undefined}
            >
              {isDel ? "…" : isConfirm ? "✓" : "×"}
            </button>

            {/* Priority badge */}
            <div
              className={s.milestonePriorityBadge}
              style={{ color: pCfg.color, background: pCfg.bg, border: `1px solid ${pCfg.border}` }}
            >
              {PRIORITY_LABELS[m.priority] ?? m.priority}
            </div>

            {/* Icon + title */}
            <span className={s.milestoneIcon}>{icon}</span>
            <div className={s.milestoneCardTitle} title={m.title}>
              {m.title}
            </div>

            {/* Location */}
            {m.location && (
              <div className={s.milestoneCardLocation} title={m.location}>
                📍 {m.location}
              </div>
            )}

            {/* Date + countdown */}
            <div className={s.milestoneCardDate}>{formatDate(m.targetDate)}</div>
            <div className={s.milestoneCardDays}>
              {days > 0
                ? `${days} días`
                : days === 0
                  ? "¡Hoy!"
                  : "Pasada"}
            </div>
          </div>
        );
      })}
    </div>
  );
}
