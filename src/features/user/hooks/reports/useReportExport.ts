"use client";

import { useState, useCallback } from "react";
import { exportReportClient } from "../../services/reports/reportService.client";
import type { ReportFormat } from "../../types/user";

export function useReportExport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportReport = useCallback(async (reportId: string, format: ReportFormat) => {
    try {
      setLoading(true);
      setError(null);
      const res = await exportReportClient(reportId, format);
      if (!res.success) throw new Error(res.error || "Failed to export report");
      return res.blob!;
    } catch (err: any) {
      console.error("❌ useReportExport error:", err);
      setError(err.message || "Failed to export report");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { exportReport, loading, error };
}
