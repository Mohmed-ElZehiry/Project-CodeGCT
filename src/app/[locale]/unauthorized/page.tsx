"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function UnauthorizedPage() {
  const pathname = usePathname();
  const router = useRouter();
  const currentLocale = pathname.split("/")[1] || "en";
  const t = useTranslations("unauthorized");

  return (
    <main className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center space-y-6">
      {/* ✅ العنوان */}
      <h1 className="text-3xl font-extrabold text-red-600 flex items-center gap-2">
        <span aria-hidden="true">🚫</span> {t("title")}
      </h1>

      {/* ✅ الوصف */}
      <p className="text-muted-foreground max-w-md leading-relaxed">{t("description")}</p>

      {/* ✅ الأزرار */}
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href={`/${currentLocale}/sign-in`}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 focus:ring-2 focus:ring-offset-2 focus:ring-primary transition"
          aria-label={t("signIn")}
        >
          {t("signIn")}
        </Link>

        <Link
          href={`/${currentLocale}`}
          className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-muted focus:ring-2 focus:ring-offset-2 focus:ring-primary transition"
          aria-label={t("backHome")}
        >
          {t("backHome")}
        </Link>

        <button
          onClick={() => router.back()}
          className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-muted focus:ring-2 focus:ring-offset-2 focus:ring-primary transition"
          aria-label={t("goBack")}
        >
          {t("goBack")}
        </button>
      </div>
    </main>
  );
}
