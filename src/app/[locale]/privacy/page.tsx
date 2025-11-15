"use client";
import { useTranslations } from "next-intl";

export default function PrivacyPage() {
  const t = useTranslations("privacy");

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">{t("title")}</h1>
      <p className="text-muted-foreground mb-6">{t("intro")}</p>
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t("dataTitle")}</h2>
        <p>{t("dataText")}</p>
        <h2 className="text-xl font-semibold">{t("securityTitle")}</h2>
        <p>{t("securityText")}</p>
      </section>
    </div>
  );
}
