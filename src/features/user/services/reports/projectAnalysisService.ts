// src/features/user/services/reports/projectAnalysisService.ts
"use client";

import type { ProjectAnalysis } from "../../types/user";
import {
  runProjectAnalysis,
  listProjectAnalyses,
  deleteProjectAnalysis,
} from "./projectAnalysisService.server";

export async function runProjectAnalysisClient(
  projectId: string,
  options: { userId: string; content: unknown; format?: "json" | "md" | "pdf" },
): Promise<ProjectAnalysis> {
  return await runProjectAnalysis(
    projectId,
    options?.userId,
    options?.content,
    options?.format ?? "json",
  );
}

export async function listProjectAnalysisClient(
  projectId: string,
  _signal?: AbortSignal,
): Promise<ProjectAnalysis[]> {
  return await listProjectAnalyses(projectId);
}

export async function deleteProjectAnalysisClient(
  projectId: string,
  analysisId: string,
): Promise<void> {
  return await deleteProjectAnalysis(projectId, analysisId);
}
