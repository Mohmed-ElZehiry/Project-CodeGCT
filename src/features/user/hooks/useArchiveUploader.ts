"use client";

import { useState } from "react";
import { uploadBackup } from "../services/archive/archiveClient";

export type ArchiveResponse = {
  filename: string;
  github_url?: string;
  report_url?: string;
  download_url?: string;
  error?: string;
};

export function useArchiveUploader() {
  const [status, setStatus] = useState<"idle" | "in-progress" | "completed" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [archiveInfo, setArchiveInfo] = useState<ArchiveResponse | null>(null);

  async function handleUpload(files: FileList) {
    setStatus("in-progress");
    setError(null);

    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append("files", file);
      });

      const res = await uploadBackup(formData);

      if (!res.success) {
        setStatus("error");
        setError(res.error || "Upload failed");
        return;
      }

      setStatus("completed");
      setArchiveInfo(res.data);

      if (res.data?.report_url) {
        window.open(res.data.report_url, "_blank");
      }
    } catch (err: any) {
      console.error("❌ [DEBUG] useArchiveUploader error:", err.message || err);
      setStatus("error");
      setError(err.message || "Unexpected error");
    }
  }

  function reset() {
    setStatus("idle");
    setError(null);
    setArchiveInfo(null);
  }

  return { status, error, archiveInfo, uploadArchive: handleUpload, reset };
}
