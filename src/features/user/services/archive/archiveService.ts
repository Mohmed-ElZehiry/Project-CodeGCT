"use server";

import fsp from "fs/promises";
import path from "path";
import os from "os";
import crypto from "crypto";
import { BACKUPS_DIR, safeJson } from "@/lib/utils";
import { logInfo, logError } from "@/lib/utils/logger";
import type { BackupFile, BackupPayload, BackupMeta } from "../../types/user";

/** ✅ توليد UID قصير */
function shortUid(len = 3): string {
  return crypto.randomBytes(len).toString("hex").toUpperCase();
}

/** ✅ توليد اسم ملف النسخة */
function generateBackupFileName(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = now.toISOString().slice(11, 19).replace(/:/g, "-");
  return `backup-${date}_${time}_${shortUid(3)}.json`;
}

/** ✅ Safe stat */
async function safeStat(p: string) {
  try {
    return await fsp.stat(p);
  } catch {
    return null;
  }
}

/**
 * ✨ إنشاء نسخة احتياطية جديدة
 */
export async function processBackup(files: Record<string, BackupFile | BackupFile[]>) {
  const start = Date.now();
  const dir = process.env.VERCEL ? os.tmpdir() : BACKUPS_DIR;
  await fsp.mkdir(dir, { recursive: true });

  const filename = generateBackupFileName();
  const fullPath = path.join(dir, filename);

  // Record → Array
  const fileList: BackupFile[] = [];
  for (const key in files) {
    const value = files[key];
    if (Array.isArray(value)) fileList.push(...value);
    else fileList.push(value);
  }

  const totalSize = fileList.reduce((a, f) => a + f.size, 0);

  // إحصاء أنواع الملفات
  const fileTypes: Record<string, number> = {};
  fileList.forEach((f) => {
    const ext = f.path.includes(".") ? f.path.split(".").pop()! : "unknown";
    fileTypes[ext] = (fileTypes[ext] || 0) + 1;
  });

  const payload: BackupPayload = {
    filename,
    summary: {
      totalFiles: fileList.length,
      totalSizeMB: +(totalSize / (1024 * 1024)).toFixed(2),
      executionTimeSec: (Date.now() - start) / 1000,
      fileTypes,
      project: {
        totalFolders: 0, // TODO: حساب المجلدات لاحقًا
        totalFiles: fileList.length,
        totalSizeMB: +(totalSize / (1024 * 1024)).toFixed(2),
      },
    },
    structure: [], // TODO: buildFolderTree لاحقًا
    files: fileList,
  };

  const json = JSON.stringify(payload, null, 2);

  try {
    await fsp.writeFile(fullPath, json, "utf-8");
    logInfo("✅ Backup created", { filename, path: fullPath });
  } catch (err) {
    logError("❌ Failed to write backup file", { filename, error: err });
    throw err;
  }

  return { filename, path: fullPath, content: json };
}

/**
 * ✨ قائمة النسخ الاحتياطية
 */
export async function listBackups(): Promise<BackupMeta[]> {
  const dir = process.env.VERCEL ? os.tmpdir() : BACKUPS_DIR;
  await fsp.mkdir(dir, { recursive: true });

  let files: string[] = [];
  try {
    files = await fsp.readdir(dir);
  } catch (err) {
    logError("❌ Failed to read backups directory", { dir, error: err });
    return [];
  }

  const backups: BackupMeta[] = [];

  for (const file of files) {
    if (!file.startsWith("backup-") || !file.endsWith(".json")) continue;
    const fullPath = path.join(dir, file);
    const stat = await safeStat(fullPath);
    if (!stat) continue;

    backups.push({
      filename: file,
      createdAt: stat.birthtime.toISOString(),
      size: stat.size,
    });
  }

  backups.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return backups;
}

/**
 * ✨ قراءة نسخة واحدة
 */
export async function getBackup(filename: string) {
  const dir = process.env.VERCEL ? os.tmpdir() : BACKUPS_DIR;
  const fullPath = path.join(dir, filename.endsWith(".json") ? filename : `${filename}.json`);

  const stat = await safeStat(fullPath);
  if (!stat) {
    logError("❌ Backup not found", { filename });
    throw new Error("❌ Backup not found");
  }

  const content = await fsp.readFile(fullPath, "utf-8");
  return {
    filename,
    size: stat.size,
    lastModified: stat.mtime.toISOString(),
    content: safeJson(content),
  };
}
