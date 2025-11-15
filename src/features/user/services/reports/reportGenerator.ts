// src/features/user/services/reportGenerator.ts

import type { AnalysisReport } from "../../types/user";

export function generateMarkdownReport(report: AnalysisReport): string {
  const deps = report.dependencies?.list || [];
  const tree = report.structure?.tree || [];
  const warnings = report.insights?.warnings || [];
  const recommendations = report.insights?.recommendations || [];

  return [
    `# Report - ${report.name}`,
    ``,
    `Created: ${report.createdAt}`,
    `Status: ${report.status}`,
    ``,
    `## Overview`,
    `- Language: ${report.overview?.language ?? "Unknown"}`,
    `- Frameworks: ${report.overview?.frameworks.join(", ") || "None"}`,
    `- Libraries: ${report.overview?.libraries.join(", ") || "None"}`,
    ``,
    `## Dependencies`,
    deps.length
      ? deps.map((d) => `- ${d.name} ${d.version} (${d.type})`).join("\n")
      : "No dependencies detected",
    ``,
    `## Structure`,
    tree.length ? tree.map((t) => `- ${t}`).join("\n") : "No structure detected",
    ``,
    `## Insights`,
    warnings.length ? `Warnings:\n${warnings.map((w) => `- ${w}`).join("\n")}` : "No warnings",
    recommendations.length
      ? `Recommendations:\n${recommendations.map((r) => `- ${r}`).join("\n")}`
      : "No recommendations",
    ``,
  ].join("\n");
}

export function generateJSONReport(report: AnalysisReport): string {
  return JSON.stringify(report, null, 2);
}

type ReportFromAnalysisInput = {
  userId: string;
  projectId: string;
  uploadId: string;
  analysis: AnalysisReport;
  format: "json" | "md" | "pdf";
};

export function reportFromAnalysis({
  userId,
  projectId,
  uploadId,
  analysis,
  format,
}: ReportFromAnalysisInput): AnalysisReport {
  const now = new Date().toISOString();

  return {
    ...analysis,
    id: analysis.id ?? `analysis-${uploadId}-${Date.now()}`,
    userId,
    projectId,
    uploadId,
    format,
    status: analysis.status ?? "completed",
    createdAt: analysis.createdAt ?? now,
    updatedAt: now,
  };
}
