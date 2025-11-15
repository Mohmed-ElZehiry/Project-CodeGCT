// src/i18n/config.ts

/**
 * ✅ قائمة اللغات المدعومة في المشروع
 */
export const locales = ["en", "ar"] as const;

/**
 * ✅ نوع الـ Locale (مستنتج من القائمة)
 */
export type Locale = (typeof locales)[number];

/**
 * ✅ اللغة الافتراضية
 */
export const defaultLocale: Locale = "en";

/**
 * ✅ دالة تتحقق إذا كانت اللغة مدعومة
 */
export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

/**
 * ✅ دالة تنظف أي مسار وتضيف له locale صحيح
 * مثال:
 *   withLocale("/sign-in", "ar") → "/ar/sign-in"
 *   withLocale("support", "en") → "/en/support"
 */
export function withLocale(path: string, locale: Locale = defaultLocale): string {
  if (!path.startsWith("/")) path = `/${path}`;
  return `/${locale}${path}`;
}
