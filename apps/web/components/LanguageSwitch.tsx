"use client";

import { useLocale } from "next-intl";
import { setLocale } from "@/app/actions/locale";
import * as s from "@/styles/pagesShared.css";

export function LanguageSwitch() {
  const locale = useLocale();

  return (
    <div className={s.langSwitchRow}>
      <button
        type="button"
        className={`${s.langBtn} ${locale === "es" ? s.langBtnActive : s.langBtnInactive}`}
        onClick={() => setLocale("es")}
        disabled={locale === "es"}
      >
        ES
      </button>
      <span className={s.langDivider}>|</span>
      <button
        type="button"
        className={`${s.langBtn} ${locale === "en" ? s.langBtnActive : s.langBtnInactive}`}
        onClick={() => setLocale("en")}
        disabled={locale === "en"}
      >
        EN
      </button>
    </div>
  );
}
