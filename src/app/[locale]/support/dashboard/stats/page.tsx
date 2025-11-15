"use client";

import { SupportStats } from "@/features/support";
import { useTranslations } from "next-intl";

export default function SupportStatsPage() {
  const t = useTranslations("supportStats");
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t("title")}</h1>
      <SupportStats />
    </div>
  );
}
