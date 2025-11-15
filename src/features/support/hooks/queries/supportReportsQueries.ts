"use client";

import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient, type MutationOptions } from "@tanstack/react-query";
import type { SupportReport, SupportComment, SupportAttachment } from "../../types/support";
import {
  createReport,
  deleteReport,
  fetchReport,
  fetchReports,
  updateReport,
  type CreateReportPayload,
  type FetchReportsParams,
  type UpdateReportPayload,
} from "../../services/supportReportsService";
import { addComment, fetchComments } from "../../services/supportCommentsService";
import {
  createAttachment,
  fetchAttachments,
  type CreateAttachmentPayload,
  type FetchAttachmentsParams,
} from "../../services/supportAttachmentsService";

export const supportReportsQueryKeys = {
  all: ["support", "reports"] as const,
  list: (filters?: FetchReportsParams) => ["support", "reports", "list", filters ?? null] as const,
  detail: (reportId: string) => ["support", "reports", "detail", reportId] as const,
  comments: (reportId: string) => ["support", "reports", "comments", reportId] as const,
  attachments: (params: FetchAttachmentsParams) =>
    [
      "support",
      "reports",
      "attachments",
      params.reportId ?? null,
      params.commentId ?? null,
    ] as const,
} as const;

export function useSupportReportsQuery(filters?: FetchReportsParams) {
  return useQuery<SupportReport[], Error>({
    queryKey: supportReportsQueryKeys.list(filters),
    queryFn: () => fetchReports(filters),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}

export function useSupportReportQuery(reportId?: string) {
  return useQuery<SupportReport, Error>({
    queryKey: reportId
      ? supportReportsQueryKeys.detail(reportId)
      : supportReportsQueryKeys.detail("__empty__"),
    queryFn: () => {
      if (!reportId) throw new Error("Missing reportId");
      return fetchReport(reportId);
    },
    enabled: Boolean(reportId),
    staleTime: 10_000,
  });
}

type CreateReportMutationOptions = Omit<
  MutationOptions<SupportReport, Error, CreateReportPayload>,
  "mutationFn"
>;

export function useCreateSupportReportMutation(options?: CreateReportMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation<SupportReport, Error, CreateReportPayload>({
    mutationFn: createReport,
    ...options,
    onSuccess: async (data, variables, context, mutation) => {
      await queryClient.invalidateQueries({ queryKey: supportReportsQueryKeys.all });
      if (options?.onSuccess) {
        await options.onSuccess(data, variables, context, mutation);
      }
    },
    onError: options?.onError,
  });
}

type UpdateReportMutationOptions = Omit<
  MutationOptions<SupportReport, Error, UpdateReportPayload>,
  "mutationFn"
>;

export function useUpdateSupportReportMutation(
  reportId?: string,
  options?: UpdateReportMutationOptions,
) {
  const queryClient = useQueryClient();

  return useMutation<SupportReport, Error, UpdateReportPayload>({
    mutationFn: (payload) => {
      if (!reportId) throw new Error("Missing reportId for update");
      return updateReport(reportId, payload);
    },
    ...options,
    onSuccess: async (data, variables, context, mutation) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: supportReportsQueryKeys.all }),
        reportId
          ? queryClient.invalidateQueries({ queryKey: supportReportsQueryKeys.detail(reportId) })
          : Promise.resolve(),
      ]);
      if (options?.onSuccess) {
        await options.onSuccess(data, variables, context, mutation);
      }
    },
    onError: options?.onError,
  });
}

type DeleteReportMutationOptions = Omit<MutationOptions<void, Error, string>, "mutationFn">;

export function useDeleteSupportReportMutation(options?: DeleteReportMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: deleteReport,
    ...options,
    onSuccess: async (data, variables, context, mutation) => {
      await queryClient.invalidateQueries({ queryKey: supportReportsQueryKeys.all });
      if (options?.onSuccess) {
        await options.onSuccess(data, variables, context, mutation);
      }
    },
    onError: options?.onError,
  });
}

export function useSupportCommentsQuery(reportId?: string) {
  return useQuery<SupportComment[], Error>({
    queryKey: reportId
      ? supportReportsQueryKeys.comments(reportId)
      : supportReportsQueryKeys.comments("__empty__"),
    queryFn: () => {
      if (!reportId) throw new Error("Missing reportId");
      return fetchComments(reportId);
    },
    enabled: Boolean(reportId),
    staleTime: 10_000,
  });
}

type CreateCommentMutationOptions = Omit<
  MutationOptions<SupportComment, Error, string>,
  "mutationFn"
>;

export function useCreateSupportCommentMutation(
  reportId?: string,
  options?: CreateCommentMutationOptions,
) {
  const queryClient = useQueryClient();

  return useMutation<SupportComment, Error, string>({
    mutationFn: async (body) => {
      if (!reportId) throw new Error("Missing reportId");
      return addComment(reportId, body);
    },
    ...options,
    onSuccess: async (data, variables, context, mutation) => {
      if (reportId) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: supportReportsQueryKeys.comments(reportId) }),
          queryClient.invalidateQueries({ queryKey: supportReportsQueryKeys.detail(reportId) }),
        ]);
      }
      if (options?.onSuccess) {
        await options.onSuccess(data, variables, context, mutation);
      }
    },
    onError: options?.onError,
  });
}

export function useSupportAttachmentsQuery(params: FetchAttachmentsParams) {
  return useQuery<SupportAttachment[], Error>({
    queryKey: supportReportsQueryKeys.attachments(params),
    queryFn: () => fetchAttachments(params),
    enabled: Boolean(params.reportId || params.commentId),
    staleTime: 10_000,
  });
}

export function useCreateSupportAttachmentMutation(
  options?: MutationOptions<SupportAttachment, Error, CreateAttachmentPayload>,
) {
  const queryClient = useQueryClient();

  return useMutation<SupportAttachment, Error, CreateAttachmentPayload>({
    mutationFn: createAttachment,
    ...options,
    onSuccess: async (data, variables, context, mutation) => {
      const params: FetchAttachmentsParams = {
        reportId: variables.reportId,
        commentId: variables.commentId,
      };
      await queryClient.invalidateQueries({
        queryKey: supportReportsQueryKeys.attachments(params),
      });
      await queryClient.invalidateQueries({
        queryKey: supportReportsQueryKeys.detail(variables.reportId ?? ""),
      });
      if (options?.onSuccess) {
        await options.onSuccess(data, variables, context, mutation);
      }
    },
    onError: options?.onError,
  });
}

export function useSupportAttachmentUploader() {
  const mutation = useCreateSupportAttachmentMutation();
  const upload = useCallback(
    (payload: CreateAttachmentPayload) => mutation.mutateAsync(payload),
    [mutation],
  );

  return { upload, ...mutation };
}
