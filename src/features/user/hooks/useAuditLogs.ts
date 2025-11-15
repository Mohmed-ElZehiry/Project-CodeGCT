"use client";

import { useEffect, useState, useCallback } from "react";
import type { UserActivity } from "../types/user";
import { fetchUserActivity } from "../services/audit-logs/auditLogService";
import { useAuth } from "@/shared/hooks/useAuth";

export function useAuditLogs(limit = 50) {
  const [logs, setLogs] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);

  const { user } = useAuth();

  const loadLogs = useCallback(async () => {
    if (!user?.id) {
      setLogs([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await fetchUserActivity(user.id, limit);
      setLogs(Array.isArray(data) ? data : []);
      setLastFetchedAt(new Date());
    } catch (err: unknown) {
      console.error("❌ useAuditLogs error:", err);
      setError(err instanceof Error ? err.message : "Unexpected error while loading logs");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, limit]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  return {
    logs,
    loading,
    error,
    refetch: loadLogs,
    hasData: logs.length > 0,
    lastFetchedAt,
  };
}
