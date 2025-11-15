"use server";

import { NextResponse } from "next/server";
import { RateLimitError, enforceRateLimit } from "@/lib/utils/rateLimiter";
import {
  SUPPORT_ATTACHMENT_COLUMNS,
  SUPPORT_REPORT_COLUMNS,
  ensureReportAccess,
  getAuthContext,
  mapAttachmentRow,
} from "../_shared";

export async function GET(request: Request) {
  const { supabase, user, role } = await getAuthContext();

  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const reportId = searchParams.get("reportId");
  const commentId = searchParams.get("commentId");

  if (!reportId && !commentId) {
    return NextResponse.json(
      { success: false, error: "reportId or commentId required" },
      { status: 400 },
    );
  }

  let baseQuery = supabase
    .from("support_attachments")
    .select(SUPPORT_ATTACHMENT_COLUMNS)
    .order("uploaded_at", { ascending: true });

  if (commentId) {
    baseQuery = baseQuery.eq("comment_id", commentId);
  } else if (reportId) {
    baseQuery = baseQuery.eq("report_id", reportId);
  }

  const { data, error } = await baseQuery;

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  if (reportId) {
    const { data: report, error: reportError } = await supabase
      .from("support_reports")
      .select(SUPPORT_REPORT_COLUMNS)
      .eq("id", reportId)
      .single();

    if (reportError || !report) {
      return NextResponse.json({ success: false, error: "Report not found" }, { status: 404 });
    }

    if (!ensureReportAccess(report, role, user.id)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
  }

  return NextResponse.json({ success: true, data: (data ?? []).map(mapAttachmentRow) });
}

export async function POST(request: Request) {
  const { supabase, user, role } = await getAuthContext();

  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await enforceRateLimit({
      key: `support:attachment:${user.id}`,
      limit: 10,
      windowMs: 10 * 60_000,
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    throw error;
  }

  const payload = await request.json().catch(() => null);
  const { reportId, commentId, fileUrl, fileType, fileSize } = payload ?? {};

  if (!reportId && !commentId) {
    return NextResponse.json(
      { success: false, error: "reportId or commentId required" },
      { status: 400 },
    );
  }

  if (typeof fileUrl !== "string" || !fileUrl.trim()) {
    return NextResponse.json({ success: false, error: "fileUrl required" }, { status: 400 });
  }

  const normalizedReportId = typeof reportId === "string" ? reportId : null;
  const normalizedCommentId = typeof commentId === "string" ? commentId : null;

  if (!normalizedReportId && !normalizedCommentId) {
    return NextResponse.json({ success: false, error: "Invalid identifiers" }, { status: 400 });
  }

  const reportToValidate = normalizedReportId;

  if (!reportToValidate && normalizedCommentId) {
    const { data: comment, error: commentError } = await supabase
      .from("support_comments")
      .select("id, report_id")
      .eq("id", normalizedCommentId)
      .single();

    if (commentError || !comment) {
      return NextResponse.json({ success: false, error: "Comment not found" }, { status: 404 });
    }

    const commentReportId = comment.report_id;

    if (!commentReportId) {
      return NextResponse.json(
        { success: false, error: "Comment missing report reference" },
        { status: 422 },
      );
    }

    const { data: commentReport, error: commentReportError } = await supabase
      .from("support_reports")
      .select(SUPPORT_REPORT_COLUMNS)
      .eq("id", commentReportId)
      .single();

    if (commentReportError || !commentReport) {
      return NextResponse.json({ success: false, error: "Report not found" }, { status: 404 });
    }

    if (!ensureReportAccess(commentReport, role, user.id)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
  } else if (reportToValidate) {
    const { data: report, error: reportError } = await supabase
      .from("support_reports")
      .select(SUPPORT_REPORT_COLUMNS)
      .eq("id", reportToValidate)
      .single();

    if (reportError || !report) {
      return NextResponse.json({ success: false, error: "Report not found" }, { status: 404 });
    }

    if (!ensureReportAccess(report, role, user.id)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
  }

  const { data, error } = await supabase
    .from("support_attachments")
    .insert({
      report_id: normalizedReportId,
      comment_id: normalizedCommentId,
      file_url: fileUrl.trim(),
      file_type: typeof fileType === "string" ? fileType : null,
      file_size: typeof fileSize === "number" ? fileSize : null,
      uploaded_by: user.id,
    })
    .select(SUPPORT_ATTACHMENT_COLUMNS)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { success: false, error: error?.message ?? "Insert failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, data: mapAttachmentRow(data) });
}
