import { NextResponse } from "next/server";
import { listReports } from "@/features/user/services/reports/reportService.server";

type RouteContext = {
  params: {
    id: string;
  };
};

/**
 * GET /api/user/projects/[id]/reports
 * جلب كل التقارير الخاصة بمشروع
 */
export async function GET(_req: Request, context: any) {
  try {
    const { params } = context as RouteContext;
    const reports = await listReports(params.id as any);
    return NextResponse.json(reports);
  } catch (err: any) {
    console.error(" GET /projects/[id]/reports error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
