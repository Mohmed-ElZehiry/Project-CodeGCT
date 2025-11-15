"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AnalysisReport, ReportFormat } from "../../types/user";
import { logError, logInfo } from "@/lib/utils/logger";
import { generateMarkdownReport, generateJSONReport } from "./reportGenerator";

/**
 * ✅ جلب كل التقارير الخاصة بمستخدم مع دعم فلترة
 */
export async function listReports(params: {
  userId: string;
  uploadId?: string;
  projectId?: string;
}): Promise<{ success: boolean; data?: AnalysisReport[]; error?: string }> {
  try {
    const supabase = await createSupabaseServerClient();
    let query = supabase.from("analysis_reports").select("*").eq("user_id", params.userId);

    if (params.uploadId) query = query.eq("upload_id", params.uploadId);
    if (params.projectId) query = query.eq("project_id", params.projectId);

    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw error;

    return { success: true, data: (data || []).map(mapRowToAnalysisReport) };
  } catch (err: any) {
    logError("❌ listReports error", { params, error: err.message });
    return { success: false, error: err.message };
  }
}

/**
 * ✅ جلب تقرير واحد بالـ id
 */
export async function readReport(
  reportId: string,
): Promise<{ success: boolean; data?: AnalysisReport; error?: string }> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("analysis_reports")
      .select("*")
      .eq("id", reportId)
      .single();
    if (error || !data) throw error;

    return { success: true, data: mapRowToAnalysisReport(data) };
  } catch (err: any) {
    logError("❌ readReport error", { reportId, error: err.message });
    return { success: false, error: err.message };
  }
}

/**
 * ✅ تصدير تقرير بصيغة معينة
 */
export async function exportReport(
  reportId: string,
  format: ReportFormat,
): Promise<{ success: boolean; mime?: string; content?: string; error?: string }> {
  try {
    const reportRes = await readReport(reportId);
    if (!reportRes.success || !reportRes.data) return { success: false, error: reportRes.error };

    const report = reportRes.data;
    if (format === "json")
      return { success: true, mime: "application/json", content: generateJSONReport(report) };
    if (format === "md")
      return { success: true, mime: "text/markdown", content: generateMarkdownReport(report) };

    const md = generateMarkdownReport(report);
    return { success: true, mime: "application/pdf", content: md };
  } catch (err: any) {
    logError("❌ exportReport error", { reportId, error: err.message });
    return { success: false, error: err.message };
  }
}

/**
 * ✅ حذف تقرير واحد بالـ id
 */
export async function deleteReport(
  reportId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("analysis_reports").delete().eq("id", reportId);
    if (error) throw error;

    logInfo("✅ Report deleted", { reportId });
    return { success: true };
  } catch (err: any) {
    logError("❌ deleteReport error", { reportId, error: err.message });
    return { success: false, error: err.message };
  }
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
