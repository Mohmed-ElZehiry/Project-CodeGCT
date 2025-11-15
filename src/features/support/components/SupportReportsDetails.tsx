"use client";

import { useMemo, useState } from "react";
import { logError, logInfo } from "@/lib/utils/logger";
import {
  useCreateSupportAttachmentMutation,
  useCreateSupportCommentMutation,
  useSupportAttachmentsQuery,
  useSupportCommentsQuery,
  useSupportReportQuery,
} from "../hooks/queries/supportReportsQueries";
import type { SupportReport } from "../types/support";

type SupportReportDetailsProps = {
  reportId?: string | null;
  onEdit?: (report: SupportReport) => void;
};

export default function SupportReportDetails({ reportId, onEdit }: SupportReportDetailsProps) {
  const {
    data: report,
    isLoading,
    isError,
    error,
    refetch,
  } = useSupportReportQuery(reportId ?? undefined);

  const {
    data: comments,
    isLoading: commentsLoading,
    isError: commentsError,
    error: commentsErrorObj,
  } = useSupportCommentsQuery(reportId ?? undefined);

  const {
    data: attachments,
    isLoading: attachmentsLoading,
    isError: attachmentsError,
    error: attachmentsErrorObj,
  } = useSupportAttachmentsQuery({ reportId: reportId ?? undefined });

  const [commentBody, setCommentBody] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [attachmentType, setAttachmentType] = useState("");

  const commentMutation = reportId
    ? useCreateSupportCommentMutation(reportId, {
        onSuccess: (comment) => {
          setCommentBody("");
          logInfo("support: comment created", {
            reportId,
            commentId: comment.id,
          });
        },
        onError: (mutationError) => {
          logError("support: comment creation failed", {
            reportId,
            error: mutationError.message,
          });
        },
      })
    : null;

  const attachmentMutation = useCreateSupportAttachmentMutation({
    onSuccess: (attachment, variables) => {
      setAttachmentUrl("");
      setAttachmentType("");
      logInfo("support: attachment uploaded", {
        reportId: variables.reportId,
        attachmentId: attachment.id,
      });
    },
    onError: (mutationError, variables) => {
      logError("support: attachment upload failed", {
        reportId: variables.reportId,
        error: mutationError.message,
      });
    },
  });

  const createdAt = useMemo(
    () => (report ? new Date(report.createdAt).toLocaleString() : null),
    [report],
  );
  const updatedAt = useMemo(
    () => (report ? new Date(report.updatedAt).toLocaleString() : null),
    [report],
  );

  if (!reportId) {
    return <p className="text-slate-500">🛈 اختر بلاغاً من القائمة لعرض تفاصيله.</p>;
  }

  if (isLoading) {
    return <p className="text-slate-400">⏳ تحميل تفاصيل البلاغ...</p>;
  }

  if (isError) {
    return (
      <div className="space-y-2 text-red-400">
        <p>❌ تعذر تحميل البلاغ: {error?.message ?? "خطأ غير معروف"}</p>
        <button
          type="button"
          className="rounded border border-red-500/40 px-3 py-1 text-sm hover:bg-red-500/10"
          onClick={() => refetch()}
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  if (!report) {
    return <p className="text-slate-400">⚠️ لم يتم العثور على البلاغ.</p>;
  }

  const handleSubmitComment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!commentBody.trim() || !commentMutation) return;
    try {
      await commentMutation.mutateAsync(commentBody.trim());
    } catch (err) {
      logError("support: comment submit handler caught error", {
        reportId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const handleSubmitAttachment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!attachmentUrl.trim() || !reportId) return;
    try {
      await attachmentMutation.mutateAsync({
        reportId,
        fileUrl: attachmentUrl.trim(),
        fileType: attachmentType.trim() || undefined,
      });
    } catch (err) {
      logError("support: attachment submit handler caught error", {
        reportId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 shadow-sm shadow-slate-900/20">
        <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-slate-100">{report.title}</h2>
            {report.description && <p className="text-sm text-slate-300">{report.description}</p>}
            <div className="flex flex-wrap gap-2 text-xs text-slate-400">
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 capitalize text-amber-200">
                الأولوية: {report.priority}
              </span>
              <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 capitalize text-blue-200">
                الحالة: {report.status.replace("_", " ")}
              </span>
              {createdAt && (
                <span className="rounded-full border border-slate-700 px-3 py-1 text-slate-300">
                  أنشئ: {createdAt}
                </span>
              )}
              {updatedAt && (
                <span className="rounded-full border border-slate-700 px-3 py-1 text-slate-300">
                  آخر تحديث: {updatedAt}
                </span>
              )}
            </div>
          </div>
          {onEdit && (
            <button
              type="button"
              className="self-start rounded-md border border-slate-700 px-3 py-1 text-sm text-slate-200 transition hover:bg-slate-800"
              onClick={() => onEdit?.(report)}
            >
              ✏️ تعديل البلاغ
            </button>
          )}
        </header>
      </section>

      <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/40 p-5 shadow-sm shadow-slate-900/20">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-100">التعليقات</h3>
          {commentsLoading && <span className="text-xs text-slate-400">⏳ تحميل...</span>}
        </div>
        {commentsError ? (
          <p className="text-sm text-red-400">
            خطأ: {commentsErrorObj?.message ?? "حدث خلل أثناء تحميل التعليقات."}
          </p>
        ) : (comments ?? []).length ? (
          <ul className="space-y-3">
            {comments!.map((comment) => (
              <li
                key={comment.id}
                className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-sm text-slate-200"
              >
                <p>{comment.comment}</p>
                <span className="mt-2 block text-xs text-slate-500">
                  {new Date(comment.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-400">لا توجد تعليقات بعد.</p>
        )}

        <form onSubmit={handleSubmitComment} className="space-y-3">
          <textarea
            className="w-full rounded-md border border-slate-700 bg-slate-900/60 p-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none"
            placeholder="أضف تعليقاً جديداً..."
            value={commentBody}
            onChange={(event) => setCommentBody(event.target.value)}
            rows={3}
          />
          <button
            type="submit"
            disabled={!commentMutation || commentMutation.isPending}
            className="rounded-md border border-blue-500/40 bg-blue-500/20 px-3 py-1 text-sm text-blue-100 transition hover:bg-blue-500/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {commentMutation?.isPending ? "جارٍ الإرسال..." : "إضافة تعليق"}
          </button>
          {commentMutation?.isError && (
            <p className="text-xs text-red-400">❌ {commentMutation.error.message}</p>
          )}
        </form>
      </section>

      <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/40 p-5 shadow-sm shadow-slate-900/20">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-100">المرفقات</h3>
          {attachmentsLoading && <span className="text-xs text-slate-400">⏳ تحميل...</span>}
        </div>
        {attachmentsError ? (
          <p className="text-sm text-red-400">
            خطأ: {attachmentsErrorObj?.message ?? "تعذر تحميل المرفقات."}
          </p>
        ) : (attachments ?? []).length ? (
          <ul className="space-y-3 text-sm text-slate-200">
            {attachments!.map((attachment) => (
              <li
                key={attachment.id}
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 p-3"
              >
                <div className="space-y-1">
                  <a
                    href={attachment.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-300 underline"
                  >
                    عرض المرفق
                  </a>
                  {attachment.fileType && (
                    <span className="block text-xs text-slate-400">{attachment.fileType}</span>
                  )}
                  <span className="block text-xs text-slate-500">
                    {new Date(attachment.uploadedAt).toLocaleString()}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-400">لا توجد مرفقات لهذا البلاغ.</p>
        )}

        <form onSubmit={handleSubmitAttachment} className="space-y-3">
          <input
            type="url"
            required
            value={attachmentUrl}
            onChange={(event) => setAttachmentUrl(event.target.value)}
            placeholder="رابط الملف"
            className="w-full rounded-md border border-slate-700 bg-slate-900/60 p-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none"
          />
          <input
            type="text"
            value={attachmentType}
            onChange={(event) => setAttachmentType(event.target.value)}
            placeholder="نوع الملف (اختياري)"
            className="w-full rounded-md border border-slate-700 bg-slate-900/60 p-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={attachmentMutation.isPending}
            className="rounded-md border border-emerald-500/40 bg-emerald-500/20 px-3 py-1 text-sm text-emerald-100 transition hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {attachmentMutation.isPending ? "جارٍ الرفع..." : "إضافة مرفق"}
          </button>
          {attachmentMutation.isError && (
            <p className="text-xs text-red-400">
              ❌ {attachmentMutation.error?.message ?? "فشل رفع المرفق"}
            </p>
          )}
        </form>
      </section>
    </div>
  );
}
