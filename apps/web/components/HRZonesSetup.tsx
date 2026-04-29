"use client";

import { useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("hrZones");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const maxHR = parseInt(value, 10);
    if (isNaN(maxHR) || maxHR < 100 || maxHR > 250) {
      setError(t("errorRange"));
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
      setError(t("errorSave"));
    }
  }

  if (currentMaxHR && !editing) {
    return (
      <div className={h.panel}>
        <div className={h.emoji}>❤️</div>
        <div>
          <div className={h.labelCaps}>{t("maxHR")}</div>
          <div className={h.valueLarge}>
            {currentMaxHR}{" "}
            <span className={h.valueUnit}>bpm</span>
          </div>
        </div>
        {settingsHref ? (
          <Link href={settingsHref} className={h.ghostBtn}>
            {t("editInProfile")}
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
            {t("edit")}
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
          {currentMaxHR ? t("editTitle") : t("setupTitle")}
        </div>
        <div className={h.help}>{t("help")}</div>
      </div>

      <form onSubmit={handleSubmit} className={h.formRow}>
        <input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t("placeholder")}
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
          {saving ? "..." : t("save")}
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
