import { getRequestConfig } from "next-intl/server";

export const locales = ["en", "ar"] as const;
export const defaultLocale = "en" as const;
export type Locale = typeof locales[number];

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

export default getRequestConfig(async ({ locale }) => {
  const requestedLocale = locale ?? defaultLocale;
  const finalLocale: Locale = isValidLocale(requestedLocale) ? requestedLocale : defaultLocale;

  try {
    const messages = (await import(`@/i18n/messages/${finalLocale}.json`)).default;
    return {
      locale: finalLocale,
      messages,
      timeZone: "Africa/Cairo", // ✅ حل مشكلة ENVIRONMENT_FALLBACK
    };
  } catch (error) {
    console.error(`❌ Failed to load messages for locale "${requestedLocale}":`, error);
    const fallbackMessages = (await import(`@/i18n/messages/${defaultLocale}.json`)).default;
    return {
      locale: defaultLocale,
      messages: fallbackMessages,
      timeZone: "Africa/Cairo",
    };
  }
});
