"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  fetchAdminSystemSettings,
  updateAdminSystemSetting,
} from "../services/adminSettingsService";
import type { AdminSystemSetting } from "../types/admin";

export const adminSettingsQueryKeys = {
  all: ["admin", "settings"] as const,
  list: () => ["admin", "settings", "list"] as const,
  byKey: (key: string) => ["admin", "settings", "detail", key] as const,
} as const;

export function useAdminSystemSettingsQuery(
  options?: UseQueryOptions<AdminSystemSetting[], Error>,
) {
  return useQuery<AdminSystemSetting[], Error>({
    queryKey: adminSettingsQueryKeys.list(),
    queryFn: fetchAdminSystemSettings,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    ...options,
  });
}

type UpdateSettingMutationOptions = Omit<
  UseMutationOptions<AdminSystemSetting, Error, { key: string; value: unknown }>,
  "mutationFn"
>;

export function useUpdateAdminSystemSettingMutation(options?: UpdateSettingMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation<AdminSystemSetting, Error, { key: string; value: unknown }>({
    mutationFn: ({ key, value }) => updateAdminSystemSetting(key, value),
    ...options,
    onSuccess: async (data, variables, context, mutation) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminSettingsQueryKeys.list() }),
        queryClient.invalidateQueries({ queryKey: adminSettingsQueryKeys.byKey(variables.key) }),
      ]);
      if (options?.onSuccess) {
        await options.onSuccess(data, variables, context, mutation);
      }
    },
  });
}
