"use client";

import { useState } from "react";
import { GoalForm } from "./GoalForm";
import { TrainingPlanView } from "./TrainingPlanView";
import { MilestoneTimeline, type MilestoneCardData } from "./MilestoneTimeline";
import { MissedDaysBanner } from "./MissedDaysBanner";
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
  generatedAt: string;
  days: TrainingDayData[];
}

export interface SerializedGoal {
  id: string;
  title: string;
  goalType: string;
  targetDate: string;
  location: string | null;
  priority: string;
  trainingPlan: TrainingPlanData | null;
}

interface Props {
  goals: SerializedGoal[];
  zoneRanges: string[] | null;
}

export function PlanPageClient({ goals, zoneRanges }: Props) {
  // Default: select the nearest upcoming goal that has a plan
  const defaultGoal =
    goals.find((g) => g.trainingPlan !== null) ??
    goals[0] ??
    null;

  const [selectedId, setSelectedId] = useState<string | null>(defaultGoal?.id ?? null);
  const [showForm, setShowForm] = useState(false);

  const milestones: MilestoneCardData[] = goals.map((g) => ({
    id: g.id,
    title: g.title,
    goalType: g.goalType,
    targetDate: g.targetDate,
    location: g.location,
    priority: g.priority,
  }));

  const selectedGoal = goals.find((g) => g.id === selectedId) ?? null;

  return (
    <>
      {/* ── Milestone timeline ── */}
      <div className={s.timelineWrapper}>
        <div className={s.timelineHeader}>
          <span className={s.timelineTitle}>🏁 Hitos</span>
          <button
            className={`${s.addMilestoneBtn} ${showForm ? s.addMilestoneBtnCancel : ""}`}
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? "✕ Cancelar" : "+ Añadir hito"}
          </button>
        </div>

        <MilestoneTimeline
          milestones={milestones}
          selectedId={selectedId}
          onSelect={(id) => {
            setSelectedId(id);
            setShowForm(false);
          }}
        />
      </div>

      {/* ── Add milestone form (collapsible) ── */}
      {showForm && (
        <div className={s.formCollapseWrapper}>
          <GoalForm onSuccess={() => setShowForm(false)} />
        </div>
      )}

      {/* ── Missed days banner (only when a plan is selected) ── */}
      {!showForm && selectedGoal?.trainingPlan && (
        <MissedDaysBanner goalId={selectedGoal.id} />
      )}

      {/* ── Training plan for selected milestone ── */}
      {!showForm && selectedGoal && (
        <TrainingPlanView goal={selectedGoal} zoneRanges={zoneRanges} />
      )}

      {/* ── Empty state when no goals at all ── */}
      {!showForm && goals.length === 0 && (
        <div className={s.timelineEmpty} style={{ marginTop: 0 }}>
          Añade tu primera carrera para que el coach genere tu plan personalizado.
        </div>
      )}

      {/* ── Goal has no plan yet ── */}
      {!showForm && selectedGoal && !selectedGoal.trainingPlan && (
        <div className={s.timelineEmpty} style={{ marginTop: 16 }}>
          Este hito todavía no tiene un plan generado. Intenta regenerarlo desde el panel de arriba.
        </div>
      )}
    </>
  );
}
