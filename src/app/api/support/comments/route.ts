"use server";

import { NextResponse } from "next/server";
import { RateLimitError, enforceRateLimit } from "@/lib/utils/rateLimiter";
import {
  SUPPORT_COMMENT_COLUMNS,
  SUPPORT_REPORT_COLUMNS,
  ensureReportAccess,
  getAuthContext,
  mapCommentRow,
} from "../_shared";

export async function GET(request: Request) {
  const { supabase, user, role } = await getAuthContext();

  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const reportId = searchParams.get("reportId");

  if (!reportId) {
    return NextResponse.json({ success: false, error: "Missing reportId" }, { status: 400 });
  }

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

  const { data, error } = await supabase
    .from("support_comments")
    .select(SUPPORT_COMMENT_COLUMNS)
    .eq("report_id", reportId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    data: (data ?? []).map(mapCommentRow),
  });
}

export async function POST(request: Request) {
  const { supabase, user, role } = await getAuthContext();

  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await enforceRateLimit({ key: `support:comment:${user.id}`, limit: 30, windowMs: 5 * 60_000 });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    throw error;
  }

  const payload = await request.json().catch(() => null);
  const { reportId, comment } = payload ?? {};

  if (typeof reportId !== "string" || !reportId) {
    return NextResponse.json({ success: false, error: "Invalid reportId" }, { status: 400 });
  }

  if (typeof comment !== "string" || !comment.trim()) {
    return NextResponse.json({ success: false, error: "Comment is required" }, { status: 400 });
  }

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

  const { data, error } = await supabase
    .from("support_comments")
    .insert({
      report_id: reportId,
      user_id: user.id,
      comment: comment.trim(),
    })
    .select(SUPPORT_COMMENT_COLUMNS)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { success: false, error: error?.message ?? "Insert failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, data: mapCommentRow(data) });
}
