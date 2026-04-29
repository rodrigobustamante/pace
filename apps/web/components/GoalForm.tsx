"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import * as s from "@/styles/planPage.css";

type GoalType = "race_5k" | "race_10k" | "half_marathon" | "marathon" | "custom";

const GOAL_ICONS: Record<GoalType, string> = {
  race_5k: "🏃",
  race_10k: "🏃",
  half_marathon: "🛣️",
  marathon: "🏆",
  custom: "🎯",
};

export function GoalForm() {
  const router = useRouter();
  const t = useTranslations("goalForm");
  const tPlan = useTranslations("plan");
  const [goalType, setGoalType] = useState<GoalType>("race_10k");
  const [title, setTitle] = useState(tPlan("goalTypes.race_10k"));
  const [targetDate, setTargetDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  function handleGoalTypeChange(type: GoalType) {
    setGoalType(type);
    setTitle(tPlan(`goalTypes.${type}` as Parameters<typeof tPlan>[0]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!targetDate) {
      setError(t("errorNoDate"));
      return;
    }
    setError(null);
    setLoading(true);
    setGenerating(true);

    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Timezone": tz,
        },
        body: JSON.stringify({ title: title || tPlan(`goalTypes.${goalType}` as Parameters<typeof tPlan>[0]), goalType, targetDate }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? t("errorCreate"));
        setGenerating(false);
        setLoading(false);
        return;
      }
      router.refresh();
    } catch {
      setError(t("errorConnection"));
      setGenerating(false);
      setLoading(false);
    }
  }

  if (generating) {
    return (
      <div className={s.generatingBox}>
        <div className={s.generatingEmoji}>🤖</div>
        <div className={s.generatingTitle}>{t("generating.title")}</div>
        <div className={s.generatingText}>{t("generating.body")}</div>
        <div className={s.spinLoader} />
      </div>
    );
  }

  // Min date = tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  return (
    <div className={s.formCard}>
      <div className={s.formTitle}>🎯 {t("title")}</div>
      <div className={s.formSub}>{t("sub")}</div>

      <form onSubmit={handleSubmit}>
        <div className={s.formGroup}>
          <label className={s.formLabel}>{t("raceTypeLabel")}</label>
          <div className={s.goalTypeGrid}>
            {(["race_5k", "race_10k", "half_marathon", "marathon"] as GoalType[]).map((type) => (
              <button
                key={type}
                type="button"
                className={`${s.goalTypeBtn} ${goalType === type ? s.goalTypeBtnActive : ""}`}
                onClick={() => handleGoalTypeChange(type)}
              >
                {GOAL_ICONS[type]} {tPlan(`goalTypes.${type}` as Parameters<typeof tPlan>[0])}
              </button>
            ))}
          </div>
        </div>

        <div className={s.formGroup}>
          <label className={s.formLabel}>{t("goalNameLabel")}</label>
          <input
            className={s.formInput}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("goalNamePlaceholder")}
          />
        </div>

        <div className={s.formGroup}>
          <label className={s.formLabel}>{t("raceDateLabel")}</label>
          <input
            className={s.formInput}
            type="date"
            value={targetDate}
            min={minDate}
            onChange={(e) => setTargetDate(e.target.value)}
            required
          />
        </div>

        {error && <div className={s.formError}>{error}</div>}

        <button type="submit" className={s.submitBtn} disabled={loading}>
          {loading ? t("submitLoading") : t("submitIdle")}
        </button>
      </form>
    </div>
  );
}
