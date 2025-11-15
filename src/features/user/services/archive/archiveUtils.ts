// src/features/user/services/backupUtils.ts

import path from "path";
import os from "os";
import { BACKUPS_DIR } from "@/lib/utils";

/** ✅ التحقق من اسم الملف */
export function validateFilenameJson(filename: string): boolean {
  return (
    typeof filename === "string" &&
    filename.endsWith(".json") &&
    !filename.includes("..") &&
    !filename.includes("/") &&
    !filename.includes("\\")
  );
}

/** ✅ مسار التحميل (stream path) */
export function downloadBackupStreamPath(filename: string): string | null {
  if (!validateFilenameJson(filename)) return null;
  const dir = process.env.VERCEL ? os.tmpdir() : BACKUPS_DIR;
  return path.join(dir, filename);
}
