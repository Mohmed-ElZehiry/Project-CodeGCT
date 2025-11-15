// src/features/user/hooks/reports/useReportGenerator.ts
"use client";

import { useState, useCallback } from "react";
import type { AnalysisReport, ReportFormat } from "../../types/user";
import { generateMarkdownReport, generateJSONReport } from "../../services/reports/reportGenerator";

export function useReportGenerator() {
  const [generated, setGenerated] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * ✨ توليد تقرير من AnalysisReport
   */
  const generate = useCallback(async (report: AnalysisReport, format: ReportFormat = "json") => {
    try {
      setLoading(true);
      setError(null);

      let output: string;
      if (format === "json") {
        output = generateJSONReport(report);
      } else if (format === "md") {
        output = generateMarkdownReport(report);
      } else {
        // Placeholder للـ PDF (ممكن نضيف لاحقاً تحويل Markdown → PDF)
        output = generateMarkdownReport(report);
      }

      setGenerated(output);
      return output;
    } catch (err: any) {
      console.error("❌ useReportGenerator.generate error:", err);
      setError(err.message || "Failed to generate report");
      setGenerated(null);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    generated,
    loading,
    error,
    generate,
    hasGenerated: !!generated,
  };
}
