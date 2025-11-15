"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type { AnalysisReport, ReportFormat } from "../../types/user";
import {
  listReportsClient,
  readReportClient,
  exportReportClient,
  deleteReportClient,
} from "../../services/reports/reportService.client";
import { useAuth } from "@/shared/hooks/useAuth";

export function useReports(userIdOverride?: string) {
  const [reports, setReports] = useState<AnalysisReport[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);

  const { user } = useAuth();
  const abortControllerRef = useRef<AbortController | null>(null);

  const effectiveUserId = userIdOverride || user?.id;

  const loadReports = useCallback(async () => {
    if (!effectiveUserId) {
      setReports([]);
      setLoading(false);
      return;
    }

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      const res = await listReportsClient(effectiveUserId, abortControllerRef.current.signal);
      if (!res.success) throw new Error(res.error || "Failed to fetch reports");
      setReports(res.data || []);
      setLastFetchedAt(new Date());
    } catch (err: any) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      console.error("❌ useReports error:", err);
      setError(err.message || "Unexpected error while loading reports");
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [effectiveUserId]);

  useEffect(() => {
    if (effectiveUserId) {
      loadReports();
    } else {
      setReports([]);
      setLoading(false);
    }
    return () => abortControllerRef.current?.abort();
  }, [effectiveUserId, loadReports]);

  const readReport = useCallback(async (reportId: string) => {
    const res = await readReportClient(reportId);
    if (!res.success) {
      setError(res.error || "Failed to read report");
      throw new Error(res.error);
    }
    return res.data!;
  }, []);

  const exportReport = useCallback(async (reportId: string, format: ReportFormat) => {
    const res = await exportReportClient(reportId, format);
    if (!res.success) {
      setError(res.error || "Failed to export report");
      throw new Error(res.error);
    }
    return res.blob!;
  }, []);

  const deleteReport = useCallback(async (reportId: string) => {
    const res = await deleteReportClient(reportId);
    if (!res.success) {
      setError(res.error || "Failed to delete report");
      throw new Error(res.error);
    }
    setReports((prev) => prev.filter((r) => r.id !== reportId));
  }, []);

  return {
    reports,
    loading,
    error,
    refetch: loadReports,
    hasData: reports.length > 0,
    lastFetchedAt,
    readReport,
    exportReport,
    deleteReport,
  };
}
