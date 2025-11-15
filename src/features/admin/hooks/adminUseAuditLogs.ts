"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAuditLogs, type AuditLog } from "../services/adminAuditService";

export const adminAuditLogsQueryKeys = {
  all: ["admin", "auditLogs"] as const,
  list: (params?: { userId?: string; limit?: number }) =>
    ["admin", "auditLogs", "list", params?.userId ?? null, params?.limit ?? null] as const,
} as const;

export function useAdminAuditLogsQuery(
  params?: { userId?: string; limit?: number },
  options?: any,
) {
  return useQuery<AuditLog[], Error>({
    queryKey: adminAuditLogsQueryKeys.list(params),
    queryFn: () => fetchAuditLogs(params),
    staleTime: 15_000,
    gcTime: 2 * 60_000,
    ...options,
  });
}
