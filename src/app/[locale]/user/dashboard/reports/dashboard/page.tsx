"use client";

import React, { useEffect } from "react";
import { ReportsDashboard } from "@/features/user/components/reports/ReportsDashboard";
import { useNotification } from "@/features/user/context/NotificationContext";
import { useReports } from "@/features/user/hooks/reports/useReports";

export default function ReportsDashboardPage() {
  const { notifyError, notifySuccess } = useNotification();
  const { reports, loading, error, hasData } = useReports();

  useEffect(() => {
    if (error) {
      notifyError("❌ خطأ في لوحة التقارير", String(error));
    } else if (hasData) {
      notifySuccess("📊 تم تحميل لوحة التقارير بنجاح");
    }
  }, [error, hasData, notifyError, notifySuccess]);

  return (
    <div className="p-6 space-y-4">
      {!hasData && !loading && !error && (
        <p className="text-sm text-muted-foreground">⚠️ لا توجد تقارير متاحة حالياً</p>
      )}

      {hasData && <ReportsDashboard reports={reports} loading={loading} error={error ?? null} />}
    </div>
  );
}
