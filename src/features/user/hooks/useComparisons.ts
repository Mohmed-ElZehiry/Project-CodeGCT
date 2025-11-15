"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type { ComparisonDoc } from "../types/user";
import {
  listComparisonsClient,
  getComparisonClient,
  runComparisonClient,
} from "../services/comparisons/comparisonService";
import { useAuth } from "@/shared/hooks/useAuth";
import { logError, logWarn, logDebug } from "@/lib/utils/logger";

export function useComparisons(userIdOverride?: string) {
  const [comparisons, setComparisons] = useState<ComparisonDoc[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);

  const { user } = useAuth();
  const abortControllerRef = useRef<AbortController | null>(null);

  const effectiveUserId = userIdOverride || user?.id;

  // 🟢 تحميل المقارنات
  const loadComparisons = useCallback(async () => {
    if (!effectiveUserId) {
      logWarn("useComparisons: userId غير متوفر", { source: "useComparisons" });
      setComparisons([]);
      setLoading(false);
      return;
    }

    // إلغاء أي طلب سابق
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      logDebug("useComparisons: جاري جلب مقارنات للمستخدم", { userId: effectiveUserId });

      const data = await listComparisonsClient();

      setComparisons(data ?? []);
      setLastFetchedAt(new Date());
    } catch (err: any) {
      console.error("❌ Error in useComparisons.loadComparisons:", {
        message: err?.message,
        name: err?.name,
        code: err?.code,
        stack: err?.stack,
      });

      if (err instanceof DOMException && err.name === "AbortError") {
        logDebug("useComparisons: تم إلغاء الطلب", { source: "useComparisons.loadComparisons" });
        return;
      }

      const errorMessage = err.message || "Unexpected error while loading comparisons";
      logError(errorMessage, {
        source: "useComparisons.loadComparisons",
        error: {
          name: err.name,
          message: err.message,
          stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
        },
      });

      setError(errorMessage);
      setComparisons([]);
    } finally {
      setLoading(false);
    }
  }, [effectiveUserId]);

  // 🟢 تشغيل عند تغيير الـ userId
  useEffect(() => {
    if (effectiveUserId) {
      loadComparisons();
    } else {
      setComparisons([]);
      setLoading(false);
    }
    return () => abortControllerRef.current?.abort();
  }, [effectiveUserId, loadComparisons]);

  // 🟢 قراءة مقارنة واحدة
  const readComparison = useCallback(async (comparisonId: string) => {
    try {
      return await getComparisonClient(comparisonId);
    } catch (err: any) {
      const errorMessage = err.message || "Failed to read comparison";
      logError(errorMessage, {
        source: "useComparisons.readComparison",
        comparisonId,
        error: {
          name: err.name,
          message: err.message,
        },
      });
      setError(errorMessage);
      throw err;
    }
  }, []);

  // 🟢 تشغيل مقارنة جديدة
  const runComparison = useCallback(
    async (upload1Id: string, upload2Id: string, projectId?: string) => {
      try {
        const result = await runComparisonClient({ upload1Id, upload2Id, projectId });
        if (!result) {
          return null;
        }

        setComparisons((prev) => [result, ...prev]);
        return result;
      } catch (err: any) {
        const errorMessage = err?.message || "Failed to run comparison";
        logError(errorMessage, {
          source: "useComparisons.runComparison",
          upload1Id,
          upload2Id,
          projectId,
          error: {
            name: err?.name,
            message: err?.message,
          },
        });
        setError(errorMessage);
        throw err;
      }
    },
    [],
  );

  return {
    comparisons,
    loading,
    error,
    refetch: loadComparisons,
    hasData: comparisons.length > 0,
    lastFetchedAt,
    readComparison,
    runComparison,
  };
}
