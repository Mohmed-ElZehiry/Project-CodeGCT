// src/features/user/components/reports/ReportsDashboard.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ReportsList } from "./ReportsList";
import { ReportDetails } from "./ReportDetails";
import type { AnalysisReport } from "../../types/user";

interface ReportsDashboardProps {
  reports: AnalysisReport[];
  loading?: boolean;
  error?: string | null;
}

export const ReportsDashboard: React.FC<ReportsDashboardProps> = ({ reports, loading, error }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedReport: AnalysisReport | null = useMemo(() => {
    if (!selectedId) return null;
    return reports.find((r) => r.id === selectedId) ?? null;
  }, [reports, selectedId]);

  useEffect(() => {
    if (reports.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !reports.some((r) => r.id === selectedId)) {
      setSelectedId(reports[0].id);
    }
  }, [reports, selectedId]);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold mb-1">لوحة التقارير</h2>
        {loading && <p className="text-sm text-muted-foreground">جارٍ تحميل التقارير...</p>}
        {error && <p className="text-sm text-destructive">خطأ: {error}</p>}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-6">
        <aside className="lg:border-r lg:pr-4">
          <ReportsList
            reports={reports}
            selectedId={selectedId}
            onSelect={(report) => setSelectedId(report.id)}
          />
        </aside>

        <main className="min-h-[300px]">
          {selectedReport ? (
            <ReportDetails report={selectedReport} />
          ) : (
            <div className="h-full flex items-center justify-center border rounded-lg p-6 text-sm text-muted-foreground">
              اختر تقريراً من القائمة لعرض التفاصيل.
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
