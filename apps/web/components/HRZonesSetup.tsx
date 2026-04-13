"use client";

import { useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import * as h from "@/styles/hrZonesSetup.css";

export function HRZonesSetup({
  currentMaxHR,
  settingsHref,
}: {
  currentMaxHR?: number | null;
  settingsHref?: string;
}) {
  const [editing, setEditing] = useState(!currentMaxHR);
  const [value, setValue] = useState(currentMaxHR ? String(currentMaxHR) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const queryClient = useQueryClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const maxHR = parseInt(value, 10);
    if (isNaN(maxHR) || maxHR < 100 || maxHR > 250) {
      setError("Ingresa un valor entre 100 y 250 bpm");
      return;
    }
    setSaving(true);
    setError("");
    const res = await fetch("/api/user/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ maxHR }),
    });
    setSaving(false);
    if (res.ok) {
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ["metrics"] });
    } else {
      setError("Error al guardar. Intenta de nuevo.");
    }
  }

  if (currentMaxHR && !editing) {
    return (
      <div className={h.panel}>
        <div className={h.emoji}>❤️</div>
        <div>
          <div className={h.labelCaps}>FC Máxima</div>
          <div className={h.valueLarge}>
            {currentMaxHR}{" "}
            <span className={h.valueUnit}>bpm</span>
          </div>
        </div>
        {settingsHref ? (
          <Link href={settingsHref} className={h.ghostBtn}>
            Modificar en Perfil
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => {
              setValue(String(currentMaxHR));
              setEditing(true);
              setError("");
            }}
            className={h.ghostBtn}
          >
            Modificar
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={h.panelEditing}>
      <div className={h.emoji}>❤️</div>
      <div>
        <div className={h.titleMd}>
          {currentMaxHR ? "Modificar FC máx" : "Configura tu FC máx"}
        </div>
        <div className={h.help}>
          Necesaria para calcular tus zonas de entrenamiento
        </div>
      </div>

      <form onSubmit={handleSubmit} className={h.formRow}>
        <input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="ej. 185"
          min={100}
          max={250}
          autoFocus
          className={h.input}
        />
        <button
          type="submit"
          disabled={saving}
          className={`${h.submitBtn} ${saving ? h.submitBtnDisabled : ""}`}
        >
          {saving ? "..." : "Guardar"}
        </button>
        {currentMaxHR ? (
          <button
            type="button"
            onClick={() => setEditing(false)}
            className={h.cancelBtn}
          >
            ✕
          </button>
        ) : null}
      </form>

      {error ? <div className={h.errorText}>{error}</div> : null}
    </div>
  );
}
