import { NextResponse } from "next/server";
import { readReport } from "@/features/user/services/reports/reportService.server";

type RouteContext = {
  params: {
    id: string;
    reportId: string;
  };
};

/**
 * ✅ GET /api/user/projects/[id]/reports/[reportId]
 * جلب تقرير واحد داخل المشروع
 */
export async function GET(_req: Request, context: any) {
  try {
    const { params } = context as RouteContext;
    const report = await readReport(params.reportId);
    return NextResponse.json(report);
  } catch (err: any) {
    console.error("❌ GET /projects/[id]/reports/[reportId] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
