"use client";

import { useEffect, useState } from "react";
import { Upload, UploadStatus } from "@/features/user/types/user";
import {
  getUploadsByUserClient,
  updateUploadStatusClient,
} from "@/features/user/services/uploads/uploadClientService";

export function useUploads(userId?: string) {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    refreshUploads(userId);
  }, [userId]);

  async function refreshUploads(uid: string) {
    setLoading(true);
    try {
      const res = await getUploadsByUserClient();
      if (!res.success) throw new Error(res.error || "Failed to fetch uploads");
      setUploads(res.data ?? []);
      setError(null);
    } catch (err: any) {
      console.error("❌ [DEBUG] useUploads error:", err.message || err);
      setError(err.message || "Unknown error while fetching uploads");
    } finally {
      setLoading(false);
    }
  }

  async function addUpload(file: File, options?: { projectId?: string }) {
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (options?.projectId) formData.append("projectId", options.projectId);

      const locale = window.location.pathname.split("/")[1] || "en";
      const res = await fetch(`/${locale}/api/user/uploads`, {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || `Upload failed (${res.status})`);
      }

      const data: Upload = json.data;
      setUploads((prev) => [data, ...prev]);
      return data;
    } catch (err: any) {
      console.error("❌ [DEBUG] addUpload error:", err.message || err);
      setError(err.message || "Unknown error while adding upload");
      throw err;
    }
  }

  async function changeStatus(
    uploadId: string,
    status: UploadStatus,
    errorMessage?: string,
    errorCode?: string,
  ) {
    try {
      const res = await updateUploadStatusClient(uploadId, status, errorMessage, errorCode);
      if (!res.success) throw new Error(res.error || "Failed to update status");
      const updated: Upload = res.data!;
      setUploads((prev) => prev.map((u) => (u.id === uploadId ? updated : u)));
      return updated;
    } catch (err: any) {
      console.error("❌ [DEBUG] changeStatus error:", err.message || err);
      setError(err.message || "Unknown error while updating status");
      throw err;
    }
  }

  return { uploads, loading, error, addUpload, changeStatus, refreshUploads, setUploads };
}
