// src/features/user/services/uploads/uploadService.ts
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Upload, UploadStatus, UploadSourceType } from "@/features/user/types/user";
import { Database } from "@/lib/supabase/database.types";

/**
 * 🟢 إنشاء Upload جديد
 */
export async function createUpload(
  userId: string,
  projectId: string | null,
  fileMeta: {
    originalFilename: string;
    fileSize?: number;
    githubUrl?: string;
    checksum?: string;
    version?: number;
    sourceType?: UploadSourceType;
  },
): Promise<{ success: boolean; data?: Upload; error?: string }> {
  const supabase = await createSupabaseServerClient();

  const uploadData: any = {
    user_id: userId,
    original_filename: fileMeta.originalFilename,
    file_size: fileMeta.fileSize ?? null,
    github_url: fileMeta.githubUrl ?? null,
    checksum: fileMeta.checksum ?? null,
    status: "pending",
    source_type: fileMeta.sourceType ?? ("archive" as UploadSourceType),
    version: fileMeta.version ?? 1,
    uploaded_at: new Date().toISOString(),
  };

  if (projectId) uploadData.project_id = projectId;

  const { data, error } = await supabase.from("uploads").insert(uploadData).select("*").single();

  if (error) return { success: false, error: error.message || "Failed to create upload" };
  return { success: true, data: mapUploadDBToUpload(data) };
}

/**
 * 🟢 جلب آخر نسخة من ملف بالاسم
 */
export async function getLatestUploadByFilename(
  filename: string,
): Promise<{ success: boolean; data?: Upload | null; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("uploads")
    .select("*")
    .eq("original_filename", filename)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return { success: false, error: error.message || "Failed to fetch latest upload" };
  return { success: true, data: data ? mapUploadDBToUpload(data) : null };
}

/**
 * 🟢 جلب الملفات الخاصة بمستخدم
 */
export async function getUploadsByUser(
  userId: string,
): Promise<{ success: boolean; data?: Upload[]; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("uploads")
    .select("*")
    .eq("user_id", userId)
    .order("uploaded_at", { ascending: false });

  if (error) return { success: false, error: error.message || "Failed to fetch uploads" };
  return { success: true, data: (data || []).map(mapUploadDBToUpload) };
}

/**
 * 🟢 تحديث حالة ملف
 */
export async function updateUploadStatus(
  uploadId: string,
  status: UploadStatus,
  errorMessage?: string,
  errorCode?: string,
): Promise<{ success: boolean; data?: Upload; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
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
  return { success: true, data: mapUploadDBToUpload(data) };
}

/**
 * 🟢 تحويل Row من DB إلى Upload
 */
function mapUploadDBToUpload(upload: Database["public"]["Tables"]["uploads"]["Row"]): Upload {
  return {
    id: upload.id,
    userId: upload.user_id,
    projectId: upload.project_id || undefined,
    sourceType: upload.source_type as UploadSourceType,
    originalFilename: upload.original_filename,
    fileSize: upload.file_size || undefined,
    githubUrl: upload.github_url || undefined,
    checksum: upload.checksum || undefined,
    version: upload.version,
    status: upload.status as UploadStatus,
    uploadedAt: upload.uploaded_at,
    errorMessage: upload.error_message || undefined,
    errorCode: (upload as any).error_code || undefined,
    metadata: (upload as any).metadata || undefined,
  };
}
