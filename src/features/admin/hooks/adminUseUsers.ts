"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { fetchAdminUsers, updateAdminUser } from "../services/adminUsersService";
import type { AdminUser, UpdateAdminUserPayload } from "../types/admin";

export const adminUsersQueryKeys = {
  all: ["admin", "users"] as const,
  list: () => ["admin", "users", "list"] as const,
} as const;

export function useAdminUsersQuery(options?: UseQueryOptions<AdminUser[], Error>) {
  return useQuery<AdminUser[], Error>({
    queryKey: adminUsersQueryKeys.list(),
    queryFn: fetchAdminUsers,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    ...options,
  });
}

type UpdateAdminUserMutationOptions = Omit<
  UseMutationOptions<AdminUser, Error, { userId: string; payload: UpdateAdminUserPayload }>,
  "mutationFn"
>;

export function useUpdateAdminUserMutation(options?: UpdateAdminUserMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation<AdminUser, Error, { userId: string; payload: UpdateAdminUserPayload }>({
    mutationFn: ({ userId, payload }) => updateAdminUser(userId, payload),
    ...options,
    onSuccess: async (data, variables, context, mutation) => {
      await queryClient.invalidateQueries({ queryKey: adminUsersQueryKeys.all });
      if (options?.onSuccess) {
        await options.onSuccess(data, variables, context, mutation);
      }
    },
  });
}
