"use client";
import { useTranslations } from "next-intl";

export default function LocaleLoading() {
  const t = useTranslations("navbar"); // أو اعمل namespace خاص بالـ loading

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="animate-pulse text-muted-foreground">{t("loading")}</p>
    </div>
  );
}
