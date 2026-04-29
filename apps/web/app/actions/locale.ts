"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const VALID_LOCALES = ["es", "en"] as const;
type Locale = (typeof VALID_LOCALES)[number];

export async function setLocale(locale: string) {
  const resolved: Locale = VALID_LOCALES.includes(locale as Locale)
    ? (locale as Locale)
    : "es";
  cookies().set("NEXT_LOCALE", resolved, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/", "layout");
}
