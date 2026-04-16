"use client";

import { useState } from "react";
import type { RunType } from "@pace/types";
import * as s from "@/styles/planPage.css";

interface TrainingDayData {
  id: string;
  date: string; // ISO date string
  title: string;
  description: string;
  workoutType: RunType;
  durationMin: number;
  targetPace: string | null;
  targetZone: string | null;
  willTrain: boolean | null;
}

interface Props {
  day: TrainingDayData;
  goalId: string;
  isPast: boolean;
}

const WORKOUT_ICONS: Record<RunType, string> = {
  easy: "🏃",
  tempo: "⚡",
  long: "🛣️",
  workout: "💪",
  race: "🏁",
  unknown: "😴",
};

const WORKOUT_LABELS: Record<RunType, string> = {
  easy: "Suave",
  tempo: "Tempo",
  long: "Largo",
  workout: "Trabajo",
  race: "Carrera",
  unknown: "Descanso",
};

const MONTH_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function getTypePill(type: RunType) {
  const map: Record<RunType, string> = {
    easy: s.dayTypePillEasy,
    tempo: s.dayTypePillTempo,
    long: s.dayTypePillLong,
    workout: s.dayTypePillWorkout,
    race: s.dayTypePillRace,
    unknown: s.dayTypePillRest,
  };
  return map[type];
}

function getCardClass(type: RunType, willTrain: boolean | null, isPast: boolean) {
  if (type === "unknown") return `${s.dayCard} ${s.dayCardRest}`;
  if (type === "race") return `${s.dayCard} ${s.dayCardRace}`;
  if (willTrain === true) return `${s.dayCard} ${s.dayCardTrain}`;
  if (willTrain === false || (isPast && willTrain === null)) return `${s.dayCard} ${s.dayCardSkip}`;
  return `${s.dayCard} ${s.dayCardDefault}`;
}

export function TrainingDayCard({ day, goalId, isPast }: Props) {
  const [willTrain, setWillTrain] = useState<boolean | null>(day.willTrain);
  const [saving, setSaving] = useState(false);

  const date = new Date(day.date);
  // Use UTC values to avoid timezone drift with @db.Date
  const dayNum = date.getUTCDate();
  const monthStr = MONTH_SHORT[date.getUTCMonth()]!;

  const todayStr = new Date().toISOString().split("T")[0];
  const dayStr = day.date.split("T")[0];
  const isToday = dayStr === todayStr;

  async function toggle(value: boolean) {
    const next = willTrain === value ? null : value;
    setSaving(true);
    setWillTrain(next);

    try {
      await fetch(`/api/goals/${goalId}/plan/days/${dayStr}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ willTrain: next }),
      });
    } catch {
      // Revert on error
      setWillTrain(willTrain);
    } finally {
      setSaving(false);
    }
  }

  const isRest = day.workoutType === "unknown";
  const isRace = day.workoutType === "race";

  return (
    <div className={getCardClass(day.workoutType, willTrain, isPast)}>
      <div className={s.dayDateCol}>
        <div className={s.dayDateNum}>{dayNum}</div>
        <div className={s.dayDateMon}>{monthStr}</div>
      </div>

      <div className={s.dayIconCol}>{WORKOUT_ICONS[day.workoutType]}</div>

      <div className={s.dayContent}>
        <div className={s.dayTitleRow}>
          <span className={s.dayTitle}>{day.title}</span>
          <span className={`${s.dayTypePill} ${getTypePill(day.workoutType)}`}>
            {WORKOUT_LABELS[day.workoutType]}
          </span>
          {isToday && <span className={s.todayBadge}>hoy</span>}
        </div>

        {!isRest && day.durationMin > 0 && (
          <div className={s.dayDuration}>⏱ ~{day.durationMin} min</div>
        )}

        {!isRest && (day.targetPace || day.targetZone) && (
          <div className={s.dayTargets}>
            {day.targetPace && (
              <span className={s.dayTargetItem}>🏃 Ritmo: {day.targetPace}</span>
            )}
            {day.targetZone && (
              <span className={s.dayTargetItem}>❤️ Zona: {day.targetZone}</span>
            )}
          </div>
        )}

        {!isRest && day.targetPace && day.targetZone && (
          <div className={s.dayPriorityHint}>
            Si este ritmo te sube por encima de la zona indicada, baja el ritmo hasta
            volver a la zona objetivo.
          </div>
        )}

        <div className={s.dayDesc}>{day.description}</div>

        {!isRest && !isRace && !isPast && (
          <div className={s.toggleRow}>
            <button
              className={`${s.toggleBtn} ${willTrain === true ? s.toggleBtnYes : ""}`}
              onClick={() => toggle(true)}
              disabled={saving}
            >
              ✓ Voy a entrenar
            </button>
            <button
              className={`${s.toggleBtn} ${willTrain === false ? s.toggleBtnNo : ""}`}
              onClick={() => toggle(false)}
              disabled={saving}
            >
              ✗ No voy
            </button>
          </div>
        )}

        {isPast && !isRest && !isRace && (
          <div className={s.toggleRow}>
            <span
              className={`${s.toggleBtn} ${willTrain === true ? s.toggleBtnYes : willTrain === false ? s.toggleBtnNo : ""}`}
              style={{ cursor: "default" }}
            >
              {willTrain === true ? "✓ Entrenaste" : willTrain === false ? "✗ Descansaste" : "— Sin confirmar"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
