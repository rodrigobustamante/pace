"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import * as s from "@/styles/planPage.css";

type GoalType = "race_5k" | "race_10k" | "half_marathon" | "marathon" | "custom";
type Priority = "A" | "B" | "C";

const GOAL_ICONS: Record<GoalType, string> = {
  race_5k: "🏃",
  race_10k: "🏃",
  half_marathon: "🛣️",
  marathon: "🏆",
  custom: "🎯",
};

const PRIORITY_CONFIG: Record<Priority, { label: string; description: string; color: string }> = {
  A: { label: "A", description: "Carrera principal", color: "#f97316" },
  B: { label: "B", description: "Carrera secundaria", color: "#a78bfa" },
  C: { label: "C", description: "Carrera de entrenamiento", color: "#64748b" },
};

const DEFAULT_TITLES: Record<GoalType, string> = {
  race_5k: "Carrera 5K",
  race_10k: "Carrera 10K",
  half_marathon: "Media Maratón",
  marathon: "Maratón",
  custom: "Objetivo personalizado",
};

export function GoalForm() {
  const router = useRouter();
  const t = useTranslations("goalForm");
  const tPlan = useTranslations("plan");

  const [goalType, setGoalType] = useState<GoalType>("race_10k");
  const [title, setTitle] = useState(DEFAULT_TITLES.race_10k);
  const [targetDate, setTargetDate] = useState("");
  const [location, setLocation] = useState("");
  const [priority, setPriority] = useState<Priority>("A");
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
        headers: { "Content-Type": "application/json", "X-User-Timezone": tz },
        body: JSON.stringify({
          title: title || DEFAULT_TITLES[goalType],
          goalType,
          targetDate,
          location: location.trim() || undefined,
          priority,
        }),
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

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  return (
    <div className={s.formCard}>
      <div className={s.formTitle}>🏁 Añadir hito</div>
      <div className={s.formSub}>Registra una carrera en tu calendario. Puedes añadir varios hitos y el plan se adaptará a todos.</div>

      <form onSubmit={handleSubmit}>
        {/* Race type */}
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

        {/* Title */}
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

        {/* Location (new) */}
        <div className={s.formGroup}>
          <label className={s.formLabel}>Lugar (opcional)</label>
          <input
            className={s.formInput}
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="ej: Madrid, Santiago, Nueva York…"
          />
        </div>

        {/* Date */}
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

        {/* Priority (new) */}
        <div className={s.formGroup}>
          <label className={s.formLabel}>Prioridad</label>
          <div style={{ display: "flex", gap: 8 }}>
            {(["A", "B", "C"] as Priority[]).map((p) => {
              const cfg = PRIORITY_CONFIG[p];
              const isSelected = priority === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  style={{
                    flex: 1,
                    padding: "10px 8px",
                    borderRadius: 10,
                    border: `1px solid ${isSelected ? cfg.color : "rgba(255,255,255,0.1)"}`,
                    background: isSelected ? `${cfg.color}18` : "rgba(255,255,255,0.04)",
                    cursor: "pointer",
                    textAlign: "center",
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{ fontSize: 18, fontWeight: 700, color: isSelected ? cfg.color : "rgba(255,255,255,0.5)", fontFamily: "var(--font-barlow)" }}>
                    {p}
                  </div>
                  <div style={{ fontSize: 10, color: isSelected ? cfg.color : "rgba(255,255,255,0.35)", marginTop: 2 }}>
                    {cfg.description}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {error && <div className={s.formError}>{error}</div>}

        <button type="submit" className={s.submitBtn} disabled={loading}>
          {loading ? t("submitLoading") : "Añadir hito y generar plan"}
        </button>
      </form>
    </div>
  );
}
