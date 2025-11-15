"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { ProjectAnalysis } from "../../types/user";
import {
  listProjectAnalysisClient,
  runProjectAnalysisClient,
  deleteProjectAnalysisClient,
} from "../../services/reports/projectAnalysisService";
import { useAuth } from "@/shared/hooks/useAuth";

export function useProjectAnalysis(projectId: string) {
  const [analysis, setAnalysis] = useState<ProjectAnalysis[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);

  const { user } = useAuth();
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadAnalysis = useCallback(async () => {
    if (!projectId) {
      setAnalysis([]);
      return;
    }

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const data = await listProjectAnalysisClient(projectId, abortControllerRef.current.signal);
      setAnalysis(data || []);
      setLastFetchedAt(new Date());
    } catch (err: any) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      console.error("❌ useProjectAnalysis.loadAnalysis error:", err);
      setError(err.message || "Unexpected error while loading project analysis");
      setAnalysis([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) loadAnalysis();
    return () => abortControllerRef.current?.abort();
  }, [projectId, loadAnalysis]);

  const runAnalysis = useCallback(
    async (options?: { userId: string; content: unknown; format?: "json" | "md" | "pdf" }) => {
      if (!options?.userId || options.content === undefined) {
        throw new Error("userId and content are required to run analysis");
      }

      try {
        const newAnalysis = await runProjectAnalysisClient(projectId, options);
        setAnalysis((prev) => [newAnalysis, ...prev]);
        return newAnalysis;
      } catch (err: any) {
        console.error("❌ useProjectAnalysis.runAnalysis error:", err);
        setError(err.message || "Failed to run analysis");
        throw err;
      }
    },
    [projectId],
  );

  const deleteAnalysis = useCallback(
    async (analysisId: string) => {
      try {
        await deleteProjectAnalysisClient(projectId, analysisId);
        setAnalysis((prev) => prev.filter((a) => a.id !== analysisId));
      } catch (err: any) {
        console.error("❌ useProjectAnalysis.deleteAnalysis error:", err);
        setError(err.message || "Failed to delete analysis");
        throw err;
      }
    },
    [projectId],
  );

  return {
    analysis,
    loading,
    error,
    refetch: loadAnalysis,
    runAnalysis,
    deleteAnalysis,
    hasData: analysis.length > 0,
    lastFetchedAt,
  };
}
