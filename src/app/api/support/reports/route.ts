"use server";

import { NextResponse } from "next/server";
import { RateLimitError, enforceRateLimit } from "@/lib/utils/rateLimiter";
import { SUPPORT_REPORT_COLUMNS, getAuthContext, mapReportRow } from "../_shared";

export async function GET(request: Request) {
  const { supabase, user, role } = await getAuthContext();

  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const userIdParam = searchParams.get("userId");

  let query = supabase
    .from("support_reports")
    .select(SUPPORT_REPORT_COLUMNS)
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (priority) query = query.eq("priority", priority);

  if (role === "user") {
    query = query.eq("user_id", user.id);
  } else if (userIdParam) {
    query = query.eq("user_id", userIdParam);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[support] GET reports error", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    data: (data ?? []).map(mapReportRow),
  });
}

export async function POST(request: Request) {
  const { supabase, user } = await getAuthContext();

  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await enforceRateLimit({ key: `support:create:${user.id}`, limit: 10, windowMs: 60_000 });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    throw error;
  }

  const payload = await request.json().catch(() => null);
  const { title, description, priority = "medium" } = payload ?? {};

  if (!title || typeof title !== "string") {
    return NextResponse.json({ success: false, error: "Missing title" }, { status: 400 });
  }

  const insertPayload = {
    title,
    description: description ?? null,
    priority,
    status: "open",
    user_id: user.id,
  };

  const { data, error } = await supabase
    .from("support_reports")
    .insert(insertPayload)
    .select(SUPPORT_REPORT_COLUMNS)
    .single();

  if (error) {
    console.error("[support] POST reports error", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    data: data ? mapReportRow(data) : null,
  });
}
