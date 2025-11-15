"use server";

import { NextResponse } from "next/server";
import { exportReport } from "@/features/user/services/reports/reportService.server";

/**
 * ✅ GET /api/user/reports/[id]/export?format=json|md|pdf|xlsx|txt
 * تصدير تقرير بصيغة معينة
 */
const allowedFormats = ["json", "md", "pdf"] as const;
type AllowedFormat = (typeof allowedFormats)[number];

function isAllowedFormat(value: string | null): value is AllowedFormat {
  return Boolean(value && allowedFormats.includes(value as AllowedFormat));
}

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const { searchParams } = new URL(req.url);
  const rawFormat = searchParams.get("format");

  if (!isAllowedFormat(rawFormat)) {
    const error = rawFormat ? "Unsupported format" : "Missing format";
    return NextResponse.json({ success: false, error }, { status: 400 });
  }

  try {
    const { id } = await context.params;
    const result = await exportReport(id, rawFormat);

    if (!result.success || !result.content || !result.mime) {
      return NextResponse.json(
        { success: false, error: result.error ?? "Failed to export report" },
        { status: 500 },
      );
    }

    const headers = new Headers();
    headers.set("Content-Type", result.mime);
    headers.set("Content-Disposition", `attachment; filename="report-${id}.${rawFormat}"`);

    return new NextResponse(result.content, { headers });
  } catch (err: any) {
    console.error("❌ GET /api/user/reports/[id]/export error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
