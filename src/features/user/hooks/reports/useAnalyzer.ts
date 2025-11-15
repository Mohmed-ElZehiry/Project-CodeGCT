"use client";

import { useState, useCallback } from "react";
import type { AnalysisReport } from "../../types/user";
import { generateReportFromFiles, AnalyzerFile } from "../../services/reports/analyzerService";

export function useAnalyzer() {
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const runAnalyzer = useCallback(
    async (
      files: AnalyzerFile[],
      options?: { userId?: string; projectId?: string; name?: string },
    ) => {
      try {
        setLoading(true);
        setError(null);
        const report = await generateReportFromFiles(files, options);
        setReport(report);
        return report;
      } catch (err: any) {
        console.error("❌ useAnalyzer error:", err);
        setError(err.message || "Unexpected error while analyzing files");
        setReport(null);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { report, loading, error, runAnalyzer };
}
