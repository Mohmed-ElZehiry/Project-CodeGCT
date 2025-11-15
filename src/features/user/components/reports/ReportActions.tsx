"use client";

import React from "react";
import { useReports } from "../../hooks/reports/useReports";
import type { ReportFormat } from "../../types/user";

interface ReportActionsProps {
  reportId: string;
}

export const ReportActions: React.FC<ReportActionsProps> = ({ reportId }) => {
  const { exportReport, deleteReport } = useReports();

  const handleExport = async (format: ReportFormat) => {
    try {
      const blob = await exportReport(reportId, format);
      if (!blob) throw new Error("Export failed");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report-${reportId}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("❌ Export failed:", err);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteReport(reportId);
    } catch (err) {
      console.error("❌ Delete failed:", err);
    }
  };

  return (
    <div className="flex gap-2 mt-2">
      <button onClick={() => handleExport("json")} className="btn btn-sm">
        Export JSON
      </button>
      <button onClick={() => handleExport("md")} className="btn btn-sm">
        Export MD
      </button>
      <button onClick={handleDelete} className="btn btn-sm btn-danger">
        Delete
      </button>
    </div>
  );
};
