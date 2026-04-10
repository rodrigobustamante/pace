"use client";

import { useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";

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

  // State: has value, not editing → show value + optional link to settings
  if (currentMaxHR && !editing) {
    return (
      <div
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 16,
          padding: 24,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 28 }}>❤️</div>
        <div>
          <div style={{ fontSize: 11, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
            FC Máxima
          </div>
          <div
            style={{
              fontSize: 36,
              fontWeight: 800,
              fontFamily: "'Barlow Condensed', sans-serif",
              color: "#f1f5f9",
              lineHeight: 1,
            }}
          >
            {currentMaxHR}{" "}
            <span style={{ fontSize: 16, color: "#475569", fontWeight: 400 }}>bpm</span>
          </div>
        </div>
        {settingsHref ? (
          <Link
            href={settingsHref}
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 6,
              color: "#475569",
              fontSize: 12,
              padding: "4px 12px",
              textDecoration: "none",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Modificar en Perfil
          </Link>
        ) : (
          <button
            onClick={() => { setValue(String(currentMaxHR)); setEditing(true); setError(""); }}
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 6,
              color: "#475569",
              fontSize: 12,
              padding: "4px 12px",
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Modificar
          </button>
        )}
      </div>
    );
  }

  // State: no value, or editing
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 16,
        padding: 24,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 28 }}>❤️</div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#f1f5f9", marginBottom: 4 }}>
          {currentMaxHR ? "Modificar FC máx" : "Configura tu FC máx"}
        </div>
        <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.5 }}>
          Necesaria para calcular tus zonas de entrenamiento
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, width: "100%", maxWidth: 220 }}>
        <input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="ej. 185"
          min={100}
          max={250}
          autoFocus
          style={{
            flex: 1,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8,
            padding: "8px 12px",
            color: "#f1f5f9",
            fontSize: 14,
            fontFamily: "'DM Mono', monospace",
            outline: "none",
            width: 0,
          }}
        />
        <button
          type="submit"
          disabled={saving}
          style={{
            background: "rgba(249,115,22,0.2)",
            border: "1px solid rgba(249,115,22,0.3)",
            borderRadius: 8,
            padding: "8px 14px",
            color: "#fb923c",
            fontSize: 13,
            fontWeight: 600,
            cursor: saving ? "not-allowed" : "pointer",
            fontFamily: "'DM Sans', sans-serif",
            whiteSpace: "nowrap",
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? "..." : "Guardar"}
        </button>
        {currentMaxHR && (
          <button
            type="button"
            onClick={() => setEditing(false)}
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8,
              padding: "8px 10px",
              color: "#475569",
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            ✕
          </button>
        )}
      </form>

      {error && <div style={{ fontSize: 12, color: "#f87171" }}>{error}</div>}
    </div>
  );
}
