"use client";

import type { AnalysisReport } from "@/features/user/types/user";

type TriggerUploadAnalysisInput = {
  locale: string;
  projectId: string | null | undefined;
  uploadId: string;
  userId: string;
  format?: "json" | "md" | "pdf";
  signal?: AbortSignal;
};

type TriggerUploadAnalysisResponse =
  | {
      success: true;
      data: AnalysisReport;
      format: "json" | "md" | "pdf";
    }
  | {
      success: false;
      error: string;
      status?: number;
    };

export async function triggerUploadAnalysis({
  locale,
  projectId,
  uploadId,
  userId,
  format = "json",
  signal,
}: TriggerUploadAnalysisInput): Promise<TriggerUploadAnalysisResponse> {
  const targetProjectId = projectId ?? "null";

  try {
    const response = await fetch(`/${locale}/api/user/projects/${targetProjectId}/analyses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        uploadId,
        format,
      }),
      signal,
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.success) {
      return {
        success: false,
        error: payload?.error || response.statusText || "Failed to run analysis",
        status: response.status,
      };
    }

    return {
      success: true,
      data: payload.data as AnalysisReport,
      format: (payload.format ?? format) as "json" | "md" | "pdf",
    };
  } catch (err: any) {
    if (err?.name === "AbortError") {
      return { success: false, error: "Analysis request cancelled" };
    }

    return { success: false, error: err?.message || "Unexpected error while running analysis" };
  }
}
