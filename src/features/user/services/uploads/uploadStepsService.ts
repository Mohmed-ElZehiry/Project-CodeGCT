// src/features/user/services/uploads/uploadStepsService.ts
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { UploadStep, UploadStepType } from "@/features/user/types/user";
import { Database } from "@/lib/supabase/database.types";

const allowedOutcomes = ["pending", "running", "done", "error"] as const;
export type StepOutcome = (typeof allowedOutcomes)[number];

// 🟢 إضافة خطوة جديدة
export async function addStep(
  uploadId: string,
  step: UploadStepType,
  details?: any,
  actor?: string,
  link?: string,
  outcome: StepOutcome = "pending",
  statusCode?: number,
  durationMs?: number,
  category?: string,
): Promise<{ success: boolean; data?: UploadStep; error?: string }> {
  if (!allowedOutcomes.includes(outcome)) {
    return { success: false, error: "Invalid outcome value" };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await (supabase as any)
    .from("upload_steps")
    .insert({
      upload_id: uploadId,
      step,
      details: details ?? null,
      actor: actor ?? null,
      link: link ?? null,
      outcome,
      status_code: statusCode ?? null,
      duration_ms: durationMs ?? null,
      category: category ?? null,
      created_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) return { success: false, error: error.message || "Failed to add upload step" };
  return { success: true, data: mapStepDBToStep(data) };
}

// 🟢 جلب الخطوات الخاصة بالملف
export async function getSteps(
  uploadId: string,
): Promise<{ success: boolean; data?: UploadStep[]; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await (supabase as any)
    .from("upload_steps")
    .select("*")
    .eq("upload_id", uploadId)
    .order("created_at", { ascending: true });

  if (error) return { success: false, error: error.message || "Failed to fetch upload steps" };
  return { success: true, data: (data || []).map(mapStepDBToStep) };
}

// 🟢 تحويل Row من DB إلى UploadStep
function mapStepDBToStep(step: any): UploadStep {
  return {
    id: step.id,
    uploadId: step.upload_id,
    step: step.step as UploadStepType,
    outcome: step.outcome,
    createdAt: step.created_at,
    details: step.details || undefined,
    actor: step.actor || undefined,
    link: step.link || undefined,
    statusCode: step.status_code || undefined,
    durationMs: step.duration_ms || undefined,
    category: step.category || undefined,
  };
}
