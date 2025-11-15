// src/features/user/services/uploads/uploadClientService.ts
import { createClient } from "@/lib/supabase/client";
import { Upload, UploadSourceType, UploadStatus } from "@/features/user/types/user";

const supabase = createClient();

/**
 * 🟢 جلب الملفات الخاصة بالمستخدم الحالي
 */
export async function getUploadsByUserClient(): Promise<{
  success: boolean;
  data?: Upload[];
  error?: string;
}> {
  const { data, error } = await supabase
    .from("uploads")
    .select("*")
    .order("uploaded_at", { ascending: false });

  if (error) return { success: false, error: error.message || "Failed to fetch uploads" };
  if (!data) return { success: true, data: [] };

  return { success: true, data: data.map(mapUploadRowToUpload) };
}

/**
 * 🟢 تحديث حالة ملف
 */
export async function updateUploadStatusClient(
  uploadId: string,
  status: UploadStatus,
  errorMessage?: string,
  errorCode?: string,
): Promise<{ success: boolean; data?: Upload; error?: string }> {
  const { data, error } = await (supabase as any)
    .from("uploads")
    .update({
      status,
      error_message: errorMessage ?? null,
      error_code: errorCode ?? null,
    })
    .eq("id", uploadId)
    .select("*")
    .single();

  if (error) return { success: false, error: error.message || "Failed to update upload status" };
  if (!data) return { success: false, error: "No data returned after update" };

  return { success: true, data: mapUploadRowToUpload(data) };
}

/**
 * 🟢 تحويل Row من DB إلى Upload
 */
function mapUploadRowToUpload(item: any): Upload {
  return {
    id: item.id,
    userId: item.user_id,
    projectId: item.project_id || undefined,
    sourceType: item.source_type as UploadSourceType,
    originalFilename: item.original_filename,
    fileSize: item.file_size || undefined,
    githubUrl: item.github_url || undefined,
    checksum: item.checksum || undefined,
    version: item.version,
    status: item.status as UploadStatus,
    uploadedAt: item.uploaded_at,
    errorMessage: item.error_message || undefined,
    errorCode: item.error_code || undefined,
    metadata: item.metadata || undefined,
  };
}
