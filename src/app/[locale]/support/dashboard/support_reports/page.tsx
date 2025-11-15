"use client";

import { SupportReportsDashboard } from "@/features/support";
import { useTranslations } from "next-intl";

export default function SupportReportsPage() {
  const t = useTranslations("supportReports");

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-slate-100">{t("title")}</h1>
        <p className="text-sm text-slate-400">{t("description")}</p>
      </header>
      <SupportReportsDashboard />
    </div>
  );
}
