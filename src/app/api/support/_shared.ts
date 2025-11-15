import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type SupportRole = Database["public"]["Enums"]["user_role"];
export type SupportReportRow = Database["public"]["Tables"]["support_reports"]["Row"];
export type SupportCommentRow = Database["public"]["Tables"]["support_comments"]["Row"];
export type SupportAttachmentRow = Database["public"]["Tables"]["support_attachments"]["Row"];

export const SUPPORT_REPORT_COLUMNS =
  "id, user_id, title, description, status, priority, created_at, updated_at";
export const SUPPORT_COMMENT_COLUMNS = "id, report_id, user_id, comment, created_at";
export const SUPPORT_ATTACHMENT_COLUMNS =
  "id, report_id, comment_id, file_url, file_type, file_size, uploaded_at, uploaded_by";

interface AuthContext {
  supabase: SupabaseClient<Database>;
  user: User | null;
  role: SupportRole | null;
}

async function resolveUserRole(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<SupportRole> {
  const { data, error } = await supabase.from("profiles").select("role").eq("id", userId).single();

  if (error) {
    console.error("[support] failed to resolve role", {
      error: error.message,
      userId,
    });
    return "user";
  }

  return (data?.role as SupportRole) ?? "user";
}

export async function getAuthContext(): Promise<AuthContext> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error && error.message !== "Auth session missing!") {
    console.error("[support] failed to fetch user", { error: error.message });
  }

  const role = user ? await resolveUserRole(supabase, user.id) : null;

  return { supabase, user, role };
}

export function ensureReportAccess(
  report: SupportReportRow | null,
  role: SupportRole | null,
  userId: string,
): boolean {
  if (!report || !role) return false;
  if (role === "user") {
    return report.user_id === userId;
  }
  return true;
}

export function mapReportRow(report: SupportReportRow) {
  return {
    id: report.id,
    userId: report.user_id,
    title: report.title,
    description: report.description,
    status: report.status,
    priority: report.priority,
    createdAt: report.created_at,
    updatedAt: report.updated_at,
  };
}

export function mapCommentRow(comment: SupportCommentRow) {
  return {
    id: comment.id,
    reportId: comment.report_id,
    userId: comment.user_id,
    comment: comment.comment,
    createdAt: comment.created_at,
  };
}

export function mapAttachmentRow(attachment: SupportAttachmentRow) {
  return {
    id: attachment.id,
    reportId: attachment.report_id,
    commentId: attachment.comment_id,
    fileUrl: attachment.file_url,
    fileType: attachment.file_type,
    fileSize: attachment.file_size,
    uploadedAt: attachment.uploaded_at,
    uploadedBy: attachment.uploaded_by,
  };
}
