"use server";

import { NextResponse } from "next/server";
import { listReports } from "@/features/user/services/reports/reportService.server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const uploadId = searchParams.get("uploadId") || undefined;
  const projectId = searchParams.get("projectId") || undefined;

  if (!userId) {
    return NextResponse.json({ success: false, error: "Missing userId" }, { status: 400 });
  }

  try {
    const result = await listReports({ userId, uploadId, projectId });
    const status = result.success ? 200 : 500;
    return NextResponse.json(result, { status });
  } catch (err: any) {
    console.error("GET /api/user/reports error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
