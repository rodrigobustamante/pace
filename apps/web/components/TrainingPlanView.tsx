"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
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

function getZoneItemClass(zone: string) {
  if (zone.startsWith("Z1")) return `${s.zoneItem} ${s.zoneItemZ1}`;
  if (zone.startsWith("Z2")) return `${s.zoneItem} ${s.zoneItemZ2}`;
  if (zone.startsWith("Z3")) return `${s.zoneItem} ${s.zoneItemZ3}`;
  if (zone.startsWith("Z4")) return `${s.zoneItem} ${s.zoneItemZ4}`;
  if (zone.startsWith("Z5")) return `${s.zoneItem} ${s.zoneItemZ5}`;
  return s.zoneItem;
}

function groupByWeek(days: TrainingDayData[], locale: string): Array<{ label: string; days: TrainingDayData[] }> {
  const weeks = new Map<string, TrainingDayData[]>();

  for (const day of days) {
    const date = new Date(day.date);
    const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const dayOfWeek = d.getUTCDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    d.setUTCDate(d.getUTCDate() + diff);
    const key = d.toISOString().split("T")[0]!;

    const existing = weeks.get(key) ?? [];
    existing.push(day);
    weeks.set(key, existing);
  }

  const fmt = (d: Date) =>
    `${d.getUTCDate()} ${new Intl.DateTimeFormat(locale, { month: "short" }).format(d)}`;

  return Array.from(weeks.entries()).map(([mondayStr, wDays]) => {
    const monday = new Date(mondayStr + "T00:00:00Z");
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);
    return { label: `${fmt(monday)} – ${fmt(sunday)}`, days: wDays };
  });
}

export function TrainingPlanView({ goal, zoneRanges }: Props) {
  const router = useRouter();
  const t = useTranslations("plan.view");
  const tPlan = useTranslations("plan");
  const locale = useLocale();
  const [deleting, setDeleting] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [regenerateError, setRegenerateError] = useState<string | null>(null);

  const targetDate = new Date(goal.targetDate);
  const todayStr = new Date().toISOString().split("T")[0]!;

  const formattedDate = targetDate.toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  async function handleDelete() {
    if (!confirm(t("deleteConfirm"))) return;
    setDeleting(true);
    await fetch(`/api/goals/${goal.id}`, { method: "DELETE" });
    router.refresh();
  }

  async function handleRegenerate() {
    if (!confirm(t("regenerateConfirm"))) return;
    setRegenerateError(null);
    setRegenerating(true);
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const res = await fetch(`/api/goals/${goal.id}/regenerate`, {
        method: "POST",
        headers: { "X-User-Timezone": tz },
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setRegenerateError(data.error ?? t("regenerateError"));
        return;
      }
      router.refresh();
    } catch {
      setRegenerateError(t("connectionError"));
    } finally {
      setRegenerating(false);
    }
  }

  const plan = goal.trainingPlan;
  const weeks = plan ? groupByWeek(plan.days, locale) : [];

  return (
    <div>
      <div className={s.planHeader}>
        <div>
          <div className={s.goalBadge}>
            <span className={s.goalBadgeLabel}>
              🎯 {tPlan(`goalTypes.${goal.goalType}` as Parameters<typeof tPlan>[0]) ?? goal.goalType}
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
            {regenerating ? t("regenerating") : t("regeneratePlan")}
          </button>
          <button
            type="button"
            className={s.deleteGoalBtn}
            onClick={handleDelete}
            disabled={deleting || regenerating}
          >
            {deleting ? t("deleting") : t("changeGoal")}
          </button>
        </div>
      </div>

      {regenerateError && <div className={s.formError}>{regenerateError}</div>}

      <div className={s.executionRuleBanner}>{t("executionRule")}</div>

      <div className={s.zonesCard}>
        <div className={s.zonesTitle}>{t("zonesTitle")}</div>
        {zoneRanges ? (
          <div className={s.zonesGrid}>
            {zoneRanges.map((zone) => (
              <div key={zone} className={getZoneItemClass(zone)}>
                {zone}
              </div>
            ))}
          </div>
        ) : (
          <div className={s.zonesHint}>{t("zonesHint")}</div>
        )}
      </div>

      {!plan && (
        <div className={s.generatingBox}>
          <div className={s.generatingEmoji}>🤖</div>
          <div className={s.generatingTitle}>{t("planUnavailable")}</div>
          <div className={s.generatingText}>{t("planUnavailableBody")}</div>
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
