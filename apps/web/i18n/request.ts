import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

const VALID_LOCALES = ["es", "en"] as const;
type Locale = (typeof VALID_LOCALES)[number];

export default getRequestConfig(async () => {
  const cookieLocale = cookies().get("NEXT_LOCALE")?.value;
  const locale: Locale = VALID_LOCALES.includes(cookieLocale as Locale)
    ? (cookieLocale as Locale)
    : "es";

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
