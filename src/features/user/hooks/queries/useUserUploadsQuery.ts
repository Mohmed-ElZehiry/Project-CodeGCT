"use client";

import { useQuery } from "@tanstack/react-query";
import type { Upload } from "@/features/user/types/user";

type ApiResponse = {
  success: boolean;
  data?: Upload[];
  error?: string;
};

export const userUploadsQueryKey = ["user-uploads"] as const;

async function fetchUserUploads(): Promise<Upload[]> {
  const response = await fetch("/api/user/uploads");
  const payload: ApiResponse = await response.json().catch(() => ({ success: false }));

  if (!response.ok || !payload.success) {
    throw new Error(payload.error || "فشل تحميل الملفات المتاحة");
  }

  return Array.isArray(payload.data) ? payload.data : [];
}

export function useUserUploadsQuery() {
  return useQuery<Upload[], Error>({
    queryKey: userUploadsQueryKey,
    queryFn: fetchUserUploads,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}
