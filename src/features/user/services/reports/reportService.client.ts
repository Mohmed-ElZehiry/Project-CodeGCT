"use client";

import type { AnalysisReport, ReportFormat } from "../../types/user";

/**
 * ✅ جلب كل تقارير المستخدم
 */
export async function listReportsClient(
  userId: string,
  signal?: AbortSignal,
): Promise<{ success: boolean; data?: AnalysisReport[]; error?: string }> {
  const res = await fetch(`/api/user/reports?userId=${encodeURIComponent(userId)}`, { signal });
  const json = await res.json();
  if (!res.ok || !json.success)
    return { success: false, error: json.error || "Failed to fetch reports" };
  return { success: true, data: json.data };
}

/**
 * ✅ جلب تقرير واحد بالـ id
 */
export async function readReportClient(
  reportId: string,
): Promise<{ success: boolean; data?: AnalysisReport; error?: string }> {
  const res = await fetch(`/api/user/reports/${encodeURIComponent(reportId)}`);
  const json = await res.json();
  if (!res.ok || !json.success)
    return { success: false, error: json.error || "Failed to read report" };
  return { success: true, data: json.data };
}

/**
 * ✅ تصدير تقرير بصيغة معينة
 */
export async function exportReportClient(
  reportId: string,
  format: ReportFormat,
): Promise<{ success: boolean; blob?: Blob; error?: string }> {
  const res = await fetch(
    `/api/user/reports/${encodeURIComponent(reportId)}/export?format=${encodeURIComponent(format)}`,
  );
  if (!res.ok) return { success: false, error: "Failed to export report" };
  const blob = await res.blob();
  return { success: true, blob };
}

/**
 * ✅ حذف تقرير واحد بالـ id
 */
export async function deleteReportClient(
  reportId: string,
): Promise<{ success: boolean; error?: string }> {
  const res = await fetch(`/api/user/reports/${encodeURIComponent(reportId)}`, {
    method: "DELETE",
  });
  const json = await res.json();
  if (!res.ok || !json.success)
    return { success: false, error: json.error || "Failed to delete report" };
  return { success: true };
}
