"use server";

import { NextResponse } from "next/server";
import {
  SUPPORT_REPORT_COLUMNS,
  ensureReportAccess,
  getAuthContext,
  mapReportRow,
} from "../../_shared";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function GET(_request: Request, context: any) {
  const { params } = context as RouteContext;
  const { supabase, user, role } = await getAuthContext();

  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("support_reports")
    .select(SUPPORT_REPORT_COLUMNS)
    .eq("id", params.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  if (!ensureReportAccess(data, role, user.id)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ success: true, data: mapReportRow(data) });
}

export async function PATCH(request: Request, context: any) {
  const { params } = context as RouteContext;
  const { supabase, user, role } = await getAuthContext();

  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { data: existing, error: fetchError } = await supabase
    .from("support_reports")
    .select(SUPPORT_REPORT_COLUMNS)
    .eq("id", params.id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  if (!ensureReportAccess(existing, role, user.id)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const { title, description, status, priority } = body as Record<string, unknown>;

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (typeof title === "string") updates.title = title;
  if (typeof description === "string" || description === null) updates.description = description;

  const allowedStatuses = ["open", "in_progress", "resolved", "closed"];
  const allowedPriorities = ["low", "medium", "high", "critical"];

  if (status) {
    if (role === "user") {
      return NextResponse.json(
        { success: false, error: "Users cannot change status" },
        { status: 403 },
      );
    }
    if (!allowedStatuses.includes(status as string)) {
      return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
    }
    updates.status = status;
  }

  if (priority) {
    if (!allowedPriorities.includes(priority as string)) {
      return NextResponse.json({ success: false, error: "Invalid priority" }, { status: 400 });
    }
    updates.priority = priority;
  }

  if (Object.keys(updates).length === 1) {
    return NextResponse.json({ success: false, error: "No changes" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("support_reports")
    .update(updates)
    .eq("id", params.id)
    .select(SUPPORT_REPORT_COLUMNS)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { success: false, error: error?.message ?? "Update failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, data: mapReportRow(data) });
}

export async function DELETE(_request: Request, context: any) {
  const { params } = context as RouteContext;
  const { supabase, user, role } = await getAuthContext();

  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("support_reports")
    .select("id, user_id")
    .eq("id", params.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  if (role === "user" && data.user_id !== user.id) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { error: deleteError } = await supabase
    .from("support_reports")
    .delete()
    .eq("id", params.id);

  if (deleteError) {
    return NextResponse.json({ success: false, error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
