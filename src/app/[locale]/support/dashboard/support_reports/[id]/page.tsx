"use client";

import { SupportReportDetails } from "@/features/support";
import { useTranslations } from "next-intl";

type ReportDetailPageParams = {
  params: {
    id: string;
  };
};

export default function ReportDetailPage(props: any) {
  const { params } = props as ReportDetailPageParams;
  const t = useTranslations("supportReports");

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t("detailTitle")}</h1>
      <SupportReportDetails reportId={params.id} />
    </div>
  );
}
