import { NextRequest, NextResponse } from "next/server";
import logger from "@/lib/utils/logger";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// ✅ GET: جلب سجل الأحداث (Audit Logs)
export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    const userId = req.nextUrl.searchParams.get("userId");
    const limit = Math.max(
      1,
      Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "50", 10), 200),
    );

    let query = supabase
      .from("audit_logs")
      .select("id, user_id, action, metadata, created_at, ip_address, user_agent")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query;

    if (error) {
      logger.logError("admin.auditLogs: failed to fetch", { error: error.message, userId });
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: error.message,
        },
        { status: 500 },
      );
    }

    const logs = (data ?? []).map((entry) => ({
      id: entry.id,
      userId: entry.user_id,
      action: entry.action,
      metadata: entry.metadata,
      createdAt: entry.created_at,
      ipAddress: entry.ip_address,
      userAgent: entry.user_agent,
    }));

    logger.logInfo("admin.auditLogs: retrieved", { count: logs.length, userId });

    return NextResponse.json({
      success: true,
      data: logs,
      error: null,
    });
  } catch (error) {
    logger.logError("admin.auditLogs: unexpected error", { error });
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : "Failed to retrieve audit logs",
      },
      { status: 500 },
    );
  }
}
