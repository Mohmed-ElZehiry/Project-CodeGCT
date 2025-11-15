"use server";

import { NextRequest, NextResponse } from "next/server";
import { processBackup, listBackups } from "@/features/user/services/archive/archiveService";
import { logError, logInfo } from "@/lib/utils/logger";

// ✅ POST: إنشاء أرشيف جديد
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files: Record<string, any> = {};

    // تحويل الـ FormData إلى Record
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        files[key] = {
          name: value.name,
          size: value.size,
          path: value.name,
        };
      }
    }

    const archive = await processBackup(files);

    logInfo("✅ Archive created via API", { filename: archive.filename });

    return NextResponse.json({ success: true, data: archive });
  } catch (err: any) {
    logError("❌ Archive creation failed", { error: err?.message });
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to create archive" },
      { status: 500 },
    );
  }
}

// ✅ GET: جلب قائمة الأرشيفات
export async function GET() {
  try {
    const archives = await listBackups();

    logInfo("✅ Archives listed via API", { count: archives.length });

    return NextResponse.json({ success: true, data: archives });
  } catch (err: any) {
    logError("❌ Failed to list archives", { error: err?.message });
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to list archives" },
      { status: 500 },
    );
  }
}
