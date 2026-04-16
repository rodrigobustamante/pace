"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TrainingDayCard } from "./TrainingDayCard";
import type { RunType } from "@pace/types";
import * as s from "@/styles/planPage.css";

interface TrainingDayData {
  id: string;
  date: string;
  title: string;
  description: string;
  workoutType: RunType;
  durationMin: number;
  targetPace: string | null;
  targetZone: string | null;
  willTrain: boolean | null;
}

interface TrainingPlanData {
  id: string;
  days: TrainingDayData[];
}

interface GoalData {
  id: string;
  title: string;
  goalType: string;
  targetDate: string;
  trainingPlan: TrainingPlanData | null;
}

interface Props {
  goal: GoalData;
  zoneRanges: string[] | null;
}

const GOAL_TYPE_LABELS: Record<string, string> = {
  race_5k: "5K",
  race_10k: "10K",
  half_marathon: "Media Maratón",
  marathon: "Maratón",
  custom: "Personalizado",
};

function getZoneItemClass(zone: string) {
  if (zone.startsWith("Z1")) return `${s.zoneItem} ${s.zoneItemZ1}`;
  if (zone.startsWith("Z2")) return `${s.zoneItem} ${s.zoneItemZ2}`;
  if (zone.startsWith("Z3")) return `${s.zoneItem} ${s.zoneItemZ3}`;
  if (zone.startsWith("Z4")) return `${s.zoneItem} ${s.zoneItemZ4}`;
  if (zone.startsWith("Z5")) return `${s.zoneItem} ${s.zoneItemZ5}`;
  return s.zoneItem;
}

function groupByWeek(days: TrainingDayData[]): Array<{ label: string; days: TrainingDayData[] }> {
  const weeks = new Map<string, TrainingDayData[]>();

  for (const day of days) {
    const date = new Date(day.date);
    // Get Monday of the week (UTC)
    const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const dayOfWeek = d.getUTCDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    d.setUTCDate(d.getUTCDate() + diff);
    const key = d.toISOString().split("T")[0]!;

    const existing = weeks.get(key) ?? [];
    existing.push(day);
    weeks.set(key, existing);
  }

  return Array.from(weeks.entries()).map(([mondayStr, wDays]) => {
    const monday = new Date(mondayStr + "T00:00:00Z");
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);

    const fmt = (d: Date) =>
      `${d.getUTCDate()} ${["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"][d.getUTCMonth()]}`;

    return { label: `${fmt(monday)} – ${fmt(sunday)}`, days: wDays };
  });
}

export function TrainingPlanView({ goal, zoneRanges }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [regenerateError, setRegenerateError] = useState<string | null>(null);

  const targetDate = new Date(goal.targetDate);
  const todayStr = new Date().toISOString().split("T")[0]!;

  const formattedDate = targetDate.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  async function handleDelete() {
    if (!confirm("¿Eliminar este objetivo y su plan de entrenamiento?")) return;
    setDeleting(true);
    await fetch(`/api/goals/${goal.id}`, { method: "DELETE" });
    router.refresh();
  }

  async function handleRegenerate() {
    if (
      !confirm(
        "¿Regenerar el plan desde hoy? Se sustituirá el plan actual por uno nuevo según tu estado y lo que marcaste en los días pasados.",
      )
    ) {
      return;
    }
    setRegenerateError(null);
    setRegenerating(true);
    try {
      const res = await fetch(`/api/goals/${goal.id}/regenerate`, { method: "POST" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setRegenerateError(data.error ?? "No se pudo regenerar el plan");
        return;
      }
      router.refresh();
    } catch {
      setRegenerateError("Error de conexión");
    } finally {
      setRegenerating(false);
    }
  }

  const plan = goal.trainingPlan;
  const weeks = plan ? groupByWeek(plan.days) : [];

  return (
    <div>
      <div className={s.planHeader}>
        <div>
          <div className={s.goalBadge}>
            <span className={s.goalBadgeLabel}>
              🎯 {GOAL_TYPE_LABELS[goal.goalType] ?? goal.goalType}
            </span>
          </div>
          <div className={s.goalTitle}>{goal.title}</div>
          <div className={s.goalDate}>{formattedDate}</div>
        </div>
        <div className={s.planHeaderActions}>
          <button
            type="button"
            className={s.regeneratePlanBtn}
            onClick={handleRegenerate}
            disabled={regenerating || deleting}
          >
            {regenerating ? "Regenerando..." : "Regenerar plan"}
          </button>
          <button
            type="button"
            className={s.deleteGoalBtn}
            onClick={handleDelete}
            disabled={deleting || regenerating}
          >
            {deleting ? "Eliminando..." : "Cambiar objetivo"}
          </button>
        </div>
      </div>

      {regenerateError && <div className={s.formError}>{regenerateError}</div>}

      <div className={s.executionRuleBanner}>
        <strong>Regla de ejecución:</strong> si ritmo y zona no coinciden, prioriza la
        zona objetivo y ajusta el ritmo ese día.
      </div>

      <div className={s.zonesCard}>
        <div className={s.zonesTitle}>Zonas de frecuencia cardiaca</div>
        {zoneRanges ? (
          <div className={s.zonesGrid}>
            {zoneRanges.map((zone) => (
              <div key={zone} className={getZoneItemClass(zone)}>
                {zone}
              </div>
            ))}
          </div>
        ) : (
          <div className={s.zonesHint}>
            Configura tu FC máx en tu perfil para ver los rangos exactos de Z1 a Z5.
          </div>
        )}
      </div>

      {!plan && (
        <div className={s.generatingBox}>
          <div className={s.generatingEmoji}>🤖</div>
          <div className={s.generatingTitle}>Plan no disponible</div>
          <div className={s.generatingText}>
            No se pudo generar el plan. Elimina el objetivo e inténtalo de nuevo.
          </div>
        </div>
      )}

      {weeks.map(({ label, days }) => (
        <div key={label} className={s.weekSection}>
          <div className={s.weekLabel}>{label}</div>
          <div className={s.daysGrid}>
            {days.map((day) => {
              const dayStr = new Date(day.date).toISOString().split("T")[0]!;
              const isPast = dayStr < todayStr;
              return (
                <TrainingDayCard
                  key={day.id}
                  day={day}
                  goalId={goal.id}
                  isPast={isPast}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
