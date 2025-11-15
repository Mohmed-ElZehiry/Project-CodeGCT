"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Upload } from "../types/user";
import { logError, logInfo } from "@/lib/utils/logger";

/**
 * ✅ جلب كل الملفات الخاصة بمشروع
 */
export async function listProjectFiles(projectId: string): Promise<Upload[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("uploads")
    .select("*")
    .eq("project_id", projectId)
    .order("uploaded_at", { ascending: false });

  if (error) {
    logError("❌ listProjectFiles error", { projectId, error: error.message });
    throw error;
  }

  return (data || []).map(
    (u) =>
      ({
        id: u.id,
        userId: u.user_id,
        projectId: u.project_id,
        sourceType: u.source_type ?? undefined,
        originalFilename: u.original_filename,
        fileSize: u.file_size,
        githubUrl: u.github_url,
        checksum: u.checksum,
        version: u.version,
        status: u.status,
        uploadedAt: u.uploaded_at,
        errorMessage: u.error_message,
      }) as Upload,
  );
}

// ✅ واجهة ملائمة للـ API: جلب كل ملفات مشروع (alias لـ listProjectFiles)
export async function getProjectFiles(projectId: string): Promise<Upload[]> {
  return listProjectFiles(projectId);
}

/**
 * ✅ حذف ملف من مشروع
 */
export async function deleteProjectFile(uploadId: string, projectId: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("uploads")
    .delete()
    .eq("id", uploadId)
    .eq("project_id", projectId);

  if (error) {
    logError("❌ deleteProjectFile error", { uploadId, projectId, error: error.message });
    throw error;
  }

  logInfo("✅ Project file deleted", { uploadId, projectId });
  return true;
}

/**
 * ✅ ربط ملف بمشروع (تحديث الـ project_id)
 */
export async function attachFileToProject(uploadId: string, projectId: string): Promise<Upload> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("uploads")
    .update({ project_id: projectId })
    .eq("id", uploadId)
    .select("*")
    .single();

  if (error || !data) {
    logError("❌ attachFileToProject error", { uploadId, projectId, error: error?.message });
    throw error;
  }

  logInfo("✅ File attached to project", { uploadId, projectId });

  return {
    id: data.id,
    userId: data.user_id,
    projectId: data.project_id,
    sourceType: data.source_type ?? undefined,
    originalFilename: data.original_filename,
    fileSize: data.file_size,
    githubUrl: data.github_url,
    checksum: data.checksum,
    version: data.version,
    status: data.status,
    uploadedAt: data.uploaded_at,
    errorMessage: data.error_message,
  } as Upload;
}

// ✅ واجهة ملائمة للـ API: جلب ملف واحد من مشروع حسب id و fileId
export async function getProjectFileById(
  projectId: string,
  fileId: string,
): Promise<Upload | null> {
  const files = await listProjectFiles(projectId);
  const file = files.find((f) => f.id === fileId) ?? null;
  if (!file) {
    logError("❌ getProjectFileById: file not found", { projectId, fileId });
  }
  return file;
}
