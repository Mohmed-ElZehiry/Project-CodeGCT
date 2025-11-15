"use client";
import { useTranslations } from "next-intl";

export default function AboutPage() {
  const t = useTranslations("about");

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">{t("title")}</h1>
      <p className="text-muted-foreground mb-6">{t("description")}</p>
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t("missionTitle")}</h2>
        <p>{t("missionText")}</p>
        <h2 className="text-xl font-semibold">{t("visionTitle")}</h2>
        <p>{t("visionText")}</p>
      </section>
    </div>
  );
}
