// src/features/user/components/reports/ReportsList.tsx
"use client";

import React from "react";
import type { AnalysisReport } from "../../types/user";

interface ReportsListProps {
  reports: AnalysisReport[];
  selectedId?: string | null;
  onSelect?: (report: AnalysisReport) => void;
}

export const ReportsList: React.FC<ReportsListProps> = ({ reports, selectedId, onSelect }) => {
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold">Reports List</h2>
      {reports.length === 0 ? (
        <p className="text-sm text-muted-foreground">لا توجد تقارير بعد.</p>
      ) : (
        <ul className="space-y-1">
          {reports.map((report) => {
            const isActive = report.id === selectedId;
            return (
              <li key={report.id}>
                <button
                  type="button"
                  onClick={() => onSelect?.(report)}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors border ${
                    isActive
                      ? "bg-primary/10 border-primary text-primary-foreground"
                      : "border-transparent hover:bg-muted"
                  }`}
                >
                  <span className="block font-medium">{report.name}</span>
                  <span className="block text-xs text-muted-foreground capitalize">
                    {report.status}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
