"use server";

import { NextRequest, NextResponse } from "next/server";
import { getBackup } from "@/features/user/services/archive/archiveService";
import {
  validateFilenameJson,
  downloadBackupStreamPath,
} from "@/features/user/services/archive/archiveUtils";
import fsp from "fs/promises";
import fs from "fs";
import { logError, logInfo } from "@/lib/utils/logger";

type RouteContext = {
  params: {
    filename: string;
  };
};

// 📥 GET: جلب أرشيف معين أو تحميله
export async function GET(req: NextRequest, context: any) {
  const { params } = context as RouteContext;
  const { filename } = params;
  if (!filename || !validateFilenameJson(filename)) {
    return NextResponse.json({ success: false, error: "Invalid filename" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const download = searchParams.get("download") === "true";

  try {
    const fullPath = downloadBackupStreamPath(filename);
    if (!fullPath) {
      return NextResponse.json({ success: false, error: "Invalid path" }, { status: 400 });
    }

    if (download) {
      // 📤 تحميل الملف كـ stream
      const stat = await fsp.stat(fullPath);
      if (!stat) {
        return NextResponse.json({ success: false, error: "Archive not found" }, { status: 404 });
      }

      const fileStream = fs.createReadStream(fullPath);

      logInfo("✅ Archive download started", { filename });

      return new NextResponse(fileStream as any, {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Content-Length": stat.size.toString(),
        },
      });
    } else {
      // 📄 قراءة محتوى الأرشيف كـ JSON
      const archive = await getBackup(filename);

      logInfo("✅ Archive retrieved via API", { filename });

      return NextResponse.json({ success: true, data: archive });
    }
  } catch (err: any) {
    logError("❌ Failed to retrieve/download archive", { filename, error: err?.message });
    return NextResponse.json(
      { success: false, error: err?.message || "Archive not found" },
      { status: 404 },
    );
  }
}

// 🗑️ DELETE: حذف أرشيف معين
export async function DELETE(req: NextRequest, context: any) {
  const { params } = context as RouteContext;
  const { filename } = params;
  if (!filename || !validateFilenameJson(filename)) {
    return NextResponse.json({ success: false, error: "Invalid filename" }, { status: 400 });
  }

  try {
    const fullPath = downloadBackupStreamPath(filename);
    if (!fullPath) {
      return NextResponse.json({ success: false, error: "Invalid path" }, { status: 400 });
    }

    await fsp.unlink(fullPath);

    logInfo("✅ Archive deleted via API", { filename });

    return NextResponse.json({ success: true, message: "Archive deleted successfully" });
  } catch (err: any) {
    logError("❌ Failed to delete archive", { filename, error: err?.message });
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to delete archive" },
      { status: 500 },
    );
  }
}
