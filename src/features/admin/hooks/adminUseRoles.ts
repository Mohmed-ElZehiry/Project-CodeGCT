"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { fetchAdminRoles, updateAdminRolePermissions } from "../services/adminRolesService";
import type { AdminRole, AdminRoleDefinition } from "../types/admin";

export const adminRolesQueryKeys = {
  all: ["admin", "roles"] as const,
  list: () => ["admin", "roles", "list"] as const,
  detail: (role: AdminRole) => ["admin", "roles", "detail", role] as const,
} as const;

export function useAdminRolesQuery(options?: UseQueryOptions<AdminRoleDefinition[], Error>) {
  return useQuery<AdminRoleDefinition[], Error>({
    queryKey: adminRolesQueryKeys.list(),
    queryFn: fetchAdminRoles,
    staleTime: 120_000,
    gcTime: 15 * 60_000,
    ...options,
  });
}

export function useUpdateAdminRolePermissionsMutation(
  options?: UseMutationOptions<
    AdminRoleDefinition,
    Error,
    { role: AdminRole; permissions: string[]; description?: string | null }
  >,
) {
  const queryClient = useQueryClient();

  return useMutation<
    AdminRoleDefinition,
    Error,
    { role: AdminRole; permissions: string[]; description?: string | null }
  >({
    mutationFn: ({ role, permissions, description }) =>
      updateAdminRolePermissions(role, permissions, description),
    ...options,
    onSuccess: async (data, variables, context, mutation) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminRolesQueryKeys.list() }),
        queryClient.invalidateQueries({ queryKey: adminRolesQueryKeys.detail(variables.role) }),
      ]);
      if (options?.onSuccess) {
        await options.onSuccess(data, variables, context, mutation);
      }
    },
  });
}
