"use client";

import { useState } from "react";
import { Upload } from "@/features/user/types/user";

const ALLOWED_EXTENSIONS = [".zip"];
const MAX_FILE_SIZE_MB = 100;

function validateFile(file: File): { isValid: boolean; error?: string } {
  const fileExt = file.name.split(".").pop()?.toLowerCase() || "";
  const isValidExtension = ALLOWED_EXTENSIONS.includes(`.${fileExt}`);
  const isValidSize = file.size <= MAX_FILE_SIZE_MB * 1024 * 1024;

  if (!isValidExtension) {
    return { isValid: false, error: "⚠️ يُسمح برفع ملفات ZIP فقط." };
  }
  if (!isValidSize) {
    return {
      isValid: false,
      error: `حجم الملف كبير جداً. الحد الأقصى ${MAX_FILE_SIZE_MB} ميجابايت`,
    };
  }
  return { isValid: true };
}

export function useFileUpload(initialProjectId?: string | null) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(initialProjectId ?? null);

  const handleFiles = async (
    fileList: FileList,
    overrideProjectId?: string | null,
  ): Promise<Upload[]> => {
    const selectedFiles = Array.from(fileList);
    setError(null);

    try {
      for (const file of selectedFiles) {
        const validation = validateFile(file);
        if (!validation.isValid) throw new Error(validation.error);
      }

      setFiles(selectedFiles);
      setUploading(true);

      const locale = window.location.pathname.split("/")[1] || "en";
      const results: Upload[] = [];
      const effectiveProjectId = overrideProjectId ?? projectId ?? null;

      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append("file", file);
        if (effectiveProjectId) formData.append("projectId", effectiveProjectId);

        const response = await fetch(`/${locale}/api/user/uploads`, {
          method: "POST",
          body: formData,
        });

        const json = await response.json();
        if (!response.ok || !json.success) {
          throw new Error(json.error || `فشل في رفع الملف (${response.status})`);
        }

        results.push(json.data);
      }

      setError(null);
      return results;
    } catch (err: any) {
      console.error("❌ [DEBUG] Upload error:", err.message || err);
      setError(err.message || "حدث خطأ أثناء رفع الملفات");
      throw err;
    } finally {
      setUploading(false);
    }
  };

  return {
    files,
    uploading,
    error,
    handleFiles,
    setProjectId,
  };
}
