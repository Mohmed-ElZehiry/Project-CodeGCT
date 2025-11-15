"use client";

import { useTranslations } from "next-intl";

export default function AdminAuditPage() {
  const t = useTranslations("adminAudit");

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">{t("title", { defaultValue: "Audit Logs" })}</h1>
      <p className="text-sm text-muted-foreground">
        {t("description", { defaultValue: "Admin audit log dashboard placeholder." })}
      </p>
    </div>
  );
}
