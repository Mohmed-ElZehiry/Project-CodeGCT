"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchBackups } from "../services/archive/archiveClient";

export type ArchiveMeta = {
  filename: string;
  createdAt: string;
  size: number;
  report_url?: string;
  download_url?: string;
  github_url?: string;
};

export function useArchive() {
  const [archives, setArchives] = useState<ArchiveMeta[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadArchives = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetchBackups();

      if (!res.success) {
        setError(res.error || "Failed to fetch archive");
        setArchives([]);
      } else {
        setArchives(res.data || []);
      }
    } catch (err: any) {
      console.error("❌ [DEBUG] useArchive error:", err.message || err);
      setError(err.message || "Unexpected error");
      setArchives([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadArchives();
  }, [loadArchives]);

  return { archives, loading, error, refetch: loadArchives };
}
