// src/features/user/hooks/reports/useReportViewer.ts
"use client";

import { useState } from "react";
import type { AnalysisReport } from "../../types/user";

export function useReportViewer(initialReport?: AnalysisReport) {
  const [report, setReport] = useState<AnalysisReport | null>(initialReport ?? null);
  const [viewMode, setViewMode] = useState<"markdown" | "json" | "pdf">("markdown");

  return {
    report,
    setReport,
    viewMode,
    setViewMode,
    isMarkdown: viewMode === "markdown",
    isJSON: viewMode === "json",
    isPDF: viewMode === "pdf",
  };
}
