"use client";

import { useState, useEffect, useCallback } from "react";
import type { Upload } from "../types/user";
import { getProjectFiles, deleteProjectFile } from "../services/projectFilesService";

export function useProjectFiles(projectId: string) {
  const [files, setFiles] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFiles = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);

    try {
      const data = await getProjectFiles(projectId);
      setFiles(data ?? []);
    } catch (err: any) {
      console.error("❌ useProjectFiles.loadFiles error:", err);
      setError(err.message || "Failed to load project files");
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const addFile = useCallback(async (file: File): Promise<Upload | null> => {
    console.warn("addFile is not implemented in useProjectFiles; use upload flows instead.");
    return null;
  }, []);

  const deleteFile = useCallback(
    async (fileId: string) => {
      try {
        await deleteProjectFile(fileId, projectId);
        setFiles((prev) => prev.filter((f) => f.id !== fileId));
      } catch (err: any) {
        console.error("❌ useProjectFiles.deleteFile error:", err);
        setError(err.message || "Failed to delete file");
        throw err;
      }
    },
    [projectId],
  );

  return { files, loading, error, refetch: loadFiles, addFile, deleteFile };
}
