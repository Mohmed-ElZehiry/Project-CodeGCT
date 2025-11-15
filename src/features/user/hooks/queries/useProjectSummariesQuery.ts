"use client";

import { useQuery, UseQueryResult } from "@tanstack/react-query";
import type { ProjectSummary } from "@/features/user/types/user";

export const projectSummariesQueryKey = (locale: string) => ["project-summaries", locale] as const;

type ApiResponse = {
  success: boolean;
  data?: any;
  error?: string;
};

async function fetchProjectSummaries(locale: string): Promise<ProjectSummary[]> {
  const response = await fetch(`/${locale}/api/user/projects`);
  const payload: ApiResponse = await response.json().catch(() => ({ success: false }));

  if (!response.ok || !payload.success) {
    throw new Error(payload.error || "تعذر تحميل قائمة المشاريع");
  }

  const rows = Array.isArray(payload.data) ? payload.data : [];
  return rows.map((item: any) => ({
    id: item.id,
    name: item.name,
    description: item.description ?? null,
    code: item.code ?? null,
    createdAt: item.created_at ?? null,
  }));
}

export function useProjectSummariesQuery(locale: string): UseQueryResult<ProjectSummary[]> {
  return useQuery<ProjectSummary[]>({
    queryKey: projectSummariesQueryKey(locale),
    queryFn: () => fetchProjectSummaries(locale),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}
