"use client";

import { useTranslations } from "next-intl";

export default function AdminProfilesPage() {
  const t = useTranslations("adminProfiles");

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">{t("title", { defaultValue: "Profiles" })}</h1>
      <p className="text-sm text-muted-foreground">
        {t("description", { defaultValue: "Admin profiles dashboard placeholder." })}
      </p>
    </div>
  );
}
