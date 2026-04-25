"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as s from "@/styles/planPage.css";

type GoalType = "race_5k" | "race_10k" | "half_marathon" | "marathon" | "custom";

const GOAL_OPTIONS: { type: GoalType; label: string; icon: string }[] = [
  { type: "race_5k", label: "5K", icon: "🏃" },
  { type: "race_10k", label: "10K", icon: "🏃" },
  { type: "half_marathon", label: "Media Maratón", icon: "🛣️" },
  { type: "marathon", label: "Maratón", icon: "🏆" },
];

const DEFAULT_TITLES: Record<GoalType, string> = {
  race_5k: "Carrera 5K",
  race_10k: "Carrera 10K",
  half_marathon: "Media Maratón",
  marathon: "Maratón",
  custom: "",
};

export function GoalForm() {
  const router = useRouter();
  const [goalType, setGoalType] = useState<GoalType>("race_10k");
  const [title, setTitle] = useState(DEFAULT_TITLES["race_10k"]);
  const [targetDate, setTargetDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  function handleGoalTypeChange(type: GoalType) {
    setGoalType(type);
    setTitle(DEFAULT_TITLES[type]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!targetDate) {
      setError("Selecciona una fecha para tu objetivo");
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
        body: JSON.stringify({ title: title || DEFAULT_TITLES[goalType], goalType, targetDate }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Error al crear el objetivo");
        setGenerating(false);
        setLoading(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Error de conexión");
      setGenerating(false);
      setLoading(false);
    }
  }

  if (generating) {
    return (
      <div className={s.generatingBox}>
        <div className={s.generatingEmoji}>🤖</div>
        <div className={s.generatingTitle}>Generando tu plan</div>
        <div className={s.generatingText}>
          El coach está analizando tu historial y creando un plan personalizado para tu objetivo.
          Esto puede tomar unos segundos.
        </div>
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
      <div className={s.formTitle}>🎯 Nuevo objetivo</div>
      <div className={s.formSub}>
        Dime cuál es tu próxima carrera y el coach creará un plan de entrenamiento personalizado.
      </div>

      <form onSubmit={handleSubmit}>
        <div className={s.formGroup}>
          <label className={s.formLabel}>Tipo de carrera</label>
          <div className={s.goalTypeGrid}>
            {GOAL_OPTIONS.map((opt) => (
              <button
                key={opt.type}
                type="button"
                className={`${s.goalTypeBtn} ${goalType === opt.type ? s.goalTypeBtnActive : ""}`}
                onClick={() => handleGoalTypeChange(opt.type)}
              >
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className={s.formGroup}>
          <label className={s.formLabel}>Nombre del objetivo</label>
          <input
            className={s.formInput}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: 10K Valencia"
          />
        </div>

        <div className={s.formGroup}>
          <label className={s.formLabel}>Fecha de la carrera</label>
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
          {loading ? "Generando plan..." : "Crear plan de entrenamiento"}
        </button>
      </form>
    </div>
  );
}
