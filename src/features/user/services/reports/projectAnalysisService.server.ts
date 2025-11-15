// src/features/user/services/reports/projectAnalysisService.server.ts
"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AnalysisReport } from "../../types/user";
import { logError, logInfo } from "@/lib/utils/logger";

export async function runProjectAnalysis(
  projectId: string,
  userId: string,
  content: unknown,
  format: "json" | "md" | "pdf" = "json",
): Promise<AnalysisReport> {
  try {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("analysis_reports")
      .insert({
        name: `Analysis-${Date.now()}`,
        user_id: userId,
        project_id: projectId,
        status: "pending",
        content: content as any,
        format,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any)
      .select("*")
      .single();

    if (error || !data) throw error;

    logInfo("✅ Project analysis created", { reportId: data.id, projectId });
    return mapRowToAnalysisReport(data);
  } catch (err: any) {
    logError("❌ runProjectAnalysis failed", { projectId, error: err?.message });
    throw err;
  }
}

export async function listProjectAnalyses(projectId: string): Promise<AnalysisReport[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("analysis_reports")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) {
    logError("❌ listProjectAnalyses error", { projectId, error: error.message });
    throw error;
  }
  return (data || []).map(mapRowToAnalysisReport);
}

export async function deleteProjectAnalysis(projectId: string, analysisId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("analysis_reports")
    .delete()
    .eq("project_id", projectId)
    .eq("id", analysisId);

  if (error) {
    logError("❌ deleteProjectAnalysis error", { projectId, analysisId, error: error.message });
    throw error;
  }
  logInfo("✅ Project analysis deleted", { analysisId, projectId });
}

/* ---------- mapping ---------- */

function mapRowToAnalysisReport(r: any): AnalysisReport {
  return {
    id: r.id,
    name: r.name,
    userId: r.user_id,
    uploadId: r.upload_id || undefined,
    projectId: r.project_id || undefined,
    backupId: r.backup_id || undefined,
    status: r.status,
    format: r.format,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    overview: r.overview || undefined,
    structure: r.structure || undefined,
    dependencies: r.dependencies || undefined,
    sections: r.sections || undefined,
    insights: r.insights || undefined,
    content: r.content,
  };
}
