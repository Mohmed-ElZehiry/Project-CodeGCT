"use server";

import { NextResponse } from "next/server";
import { readReport, deleteReport } from "@/features/user/services/reports/reportService.server";

/**
 * ✅ GET /api/user/reports/[id]
 * جلب تقرير واحد بالـ id
 */
export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const report = await readReport(id);
    return NextResponse.json({ success: true, data: report });
  } catch (err: any) {
    console.error("❌ GET /api/user/reports/[id] error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * ✅ DELETE /api/user/reports/[id]
 * حذف تقرير واحد بالـ id
 */
export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    await deleteReport(id);
    return NextResponse.json({ success: true, message: "Report deleted successfully" });
  } catch (err: any) {
    console.error("❌ DELETE /api/user/reports/[id] error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
