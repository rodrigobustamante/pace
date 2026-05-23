"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import * as s from "@/styles/planPage.css";

interface MissedDay {
  date: string;
  title: string;
}

interface CheckMissedResponse {
  newlyMarked: number;
  missedDays: MissedDay[];
  skipped: boolean;
}

interface Props {
  goalId: string;
}

export function MissedDaysBanner({ goalId }: Props) {
  const router = useRouter();
  const [missedDays, setMissedDays] = useState<MissedDay[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function checkMissed() {
      try {
        const res = await fetch(`/api/goals/${goalId}/check-missed`, {
          method: "POST",
        });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as CheckMissedResponse;
        if (!cancelled && data.newlyMarked > 0) {
          setMissedDays(data.missedDays);
        }
      } catch {
        // Silent — best-effort check
      }
    }

    checkMissed();
    return () => {
      cancelled = true;
    };
  }, [goalId]);

  async function handleRegenerate() {
    setRegenerating(true);
    setError(null);
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const res = await fetch(`/api/goals/${goalId}/regenerate`, {
        method: "POST",
        headers: { "X-User-Timezone": tz },
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Error al regenerar el plan");
        return;
      }
      setDismissed(true);
      router.refresh();
    } catch {
      setError("Error de conexión");
    } finally {
      setRegenerating(false);
    }
  }

  if (dismissed || missedDays.length === 0) return null;

  const count = missedDays.length;
  const dayList = missedDays
    .slice(0, 3)
    .map((d) => d.title)
    .join(", ");
  const extra = count > 3 ? ` y ${count - 3} más` : "";

  return (
    <div className={s.missedBanner}>
      <span className={s.missedBannerIcon}>⚠️</span>
      <div className={s.missedBannerBody}>
        <div className={s.missedBannerTitle}>
          {count === 1
            ? "Perdiste 1 entrenamiento"
            : `Perdiste ${count} entrenamientos`}
        </div>
        <div className={s.missedBannerText}>
          {dayList}{extra}. Tu plan puede actualizarse para redistribuir la carga
          y mantener el taper para tu próxima carrera.
        </div>
        {error && (
          <div style={{ fontSize: 11, color: "#f87171", marginTop: 6 }}>
            {error}
          </div>
        )}
        <div className={s.missedBannerActions}>
          <button
            className={s.missedBannerBtn}
            onClick={handleRegenerate}
            disabled={regenerating}
          >
            {regenerating ? "Actualizando plan…" : "Actualizar plan"}
          </button>
          <button
            className={s.missedBannerDismiss}
            onClick={() => setDismissed(true)}
            disabled={regenerating}
          >
            Ignorar
          </button>
        </div>
      </div>
    </div>
  );
}
