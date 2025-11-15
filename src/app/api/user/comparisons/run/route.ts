"use server";

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logError, logInfo } from "@/lib/utils/logger";
import { diffLines } from "diff";
import { Readable } from "node:stream";
import { finished } from "node:stream/promises";
import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";

/**
 * 📥 GET: مقارنة مؤقتة بين ملفين (Preview)
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const upload1Id = searchParams.get("upload1Id");
    const upload2Id = searchParams.get("upload2Id");

    if (!upload1Id || !upload2Id) {
      return NextResponse.json({ success: false, error: "Missing upload IDs" }, { status: 400 });
    }

    const { upload1, upload2, projectId } = await fetchUploadsForComparison(supabase, user.id, {
      upload1Id,
      upload2Id,
      projectId: undefined,
    });

    const previewResult = buildPreviewComparison(upload1, upload2, projectId, true);

    logInfo("✅ Comparison preview generated", {
      upload1Id,
      upload2Id,
      userId: user.id,
      projectId,
    });
    return NextResponse.json({ success: true, data: previewResult });
  } catch (err: any) {
    logError("❌ Comparison preview failed", { error: err?.message });
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to generate preview" },
      { status: 500 },
    );
  }
}

/**
 * ✅ POST: تنفيذ مقارنة فعلية وتخزينها في DB
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { upload1Id, upload2Id, projectId } = body;

    if (!upload1Id || !upload2Id) {
      return NextResponse.json({ success: false, error: "Missing upload IDs" }, { status: 400 });
    }

    const {
      upload1,
      upload2,
      projectId: detectedProjectId,
    } = await fetchUploadsForComparison(supabase, user.id, {
      upload1Id,
      upload2Id,
      projectId,
    });

    const comparisonResult = await executeComparison(upload1, upload2);

    const { data, error } = await supabase
      .from("comparisons")
      .insert({
        user_id: user.id,
        upload1_id: upload1Id,
        upload2_id: upload2Id,
        project_id: detectedProjectId,
        result: comparisonResult,
        status: "completed",
      })
      .select("*")
      .single();

    if (error) throw error;

    logInfo("✅ Comparison executed and stored", {
      comparisonId: data.id,
      userId: user.id,
      detectedProjectId,
    });
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err: any) {
    logError("❌ Comparison execution failed", { error: err?.message });
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to run comparison" },
      { status: 500 },
    );
  }
}

type UploadRow = {
  id: string;
  user_id: string;
  project_id?: string | null;
  original_filename: string;
  file_size?: number | null;
  checksum?: string | null;
  github_url?: string | null;
};

async function fetchUploadsForComparison(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  params: { upload1Id: string; upload2Id: string; projectId?: string | null },
): Promise<{ upload1: UploadRow; upload2: UploadRow; projectId: string | null }> {
  const { upload1Id, upload2Id, projectId } = params;

  const { data: uploads, error } = await supabase
    .from("uploads")
    .select("id, user_id, project_id, original_filename, file_size, checksum, github_url")
    .in("id", [upload1Id, upload2Id]);

  if (error || !uploads || uploads.length !== 2) {
    throw new Error("Uploads not found or inaccessible");
  }

  const [upload1, upload2] = uploads.sort((a, b) =>
    a.id === upload1Id ? -1 : b.id === upload1Id ? 1 : 0,
  ) as UploadRow[];

  if (upload1.user_id !== userId || upload2.user_id !== userId) {
    throw new Error("Uploads do not belong to the current user");
  }

  const effectiveProjectId = projectId ?? upload1.project_id ?? upload2.project_id ?? null;

  if (effectiveProjectId) {
    if (upload1.project_id && upload1.project_id !== effectiveProjectId) {
      throw new Error("Upload 1 does not belong to the selected project");
    }
    if (upload2.project_id && upload2.project_id !== effectiveProjectId) {
      throw new Error("Upload 2 does not belong to the selected project");
    }
  }

  return { upload1, upload2, projectId: effectiveProjectId };
}

function buildPreviewComparison(
  upload1: UploadRow,
  upload2: UploadRow,
  projectId: string | null,
  preview = false,
) {
  const diffSize = Math.abs((upload1.file_size ?? 0) - (upload2.file_size ?? 0));
  const sameChecksum = Boolean(
    upload1.checksum && upload2.checksum && upload1.checksum === upload2.checksum,
  );

  return {
    projectId: projectId ?? null,
    fileA: upload1.original_filename,
    fileB: upload2.original_filename,
    diffSize,
    sameChecksum,
    status: preview ? "preview" : "completed",
    createdAt: new Date().toISOString(),
  };
}

async function executeComparison(upload1: UploadRow, upload2: UploadRow) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "comparison-"));

  try {
    const fileAPath = await downloadFile(upload1.github_url, upload1.id, tempDir);
    const fileBPath = await downloadFile(upload2.github_url, upload2.id, tempDir);

    const summary = await diffFiles(
      fileAPath,
      fileBPath,
      upload1.original_filename,
      upload2.original_filename,
    );

    return {
      ...buildPreviewComparison(
        upload1,
        upload2,
        upload1.project_id ?? upload2.project_id ?? null,
        false,
      ),
      ...summary,
    };
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

async function downloadFile(url: string | null | undefined, uploadId: string, destDir: string) {
  if (!url) {
    throw new Error(`Upload ${uploadId} is missing a download URL`);
  }

  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(`Failed to download upload ${uploadId}. Status: ${response.status}`);
  }

  const filename = `${uploadId}.zip`;
  const targetPath = path.join(destDir, filename);
  await fs.mkdir(destDir, { recursive: true });
  const fileStream = (await fs.open(targetPath, "w")).createWriteStream();
  await finished(Readable.fromWeb(response.body as any).pipe(fileStream));

  return targetPath;
}

async function diffFiles(
  fileAPath: string,
  fileBPath: string,
  filenameA: string,
  filenameB: string,
) {
  const extractedAPath = await extractZip(fileAPath, `${filenameA}-A`);
  const extractedBPath = await extractZip(fileBPath, `${filenameB}-B`);

  const filesMap = new Map<string, { a?: string; b?: string }>();

  await collectFiles(extractedAPath, extractedAPath, filesMap, "a");
  await collectFiles(extractedBPath, extractedBPath, filesMap, "b");

  const changes: Array<{
    path: string;
    changeType: "added" | "removed" | "modified";
    summary: string;
  }> = [];
  const changedFiles: string[] = [];
  const addedFiles: string[] = [];
  const removedFiles: string[] = [];

  for (const [filePath, entry] of filesMap.entries()) {
    if (entry.a && entry.b) {
      const diffSummary = await diffFileContent(entry.a, entry.b);
      if (diffSummary.changesCount > 0) {
        changes.push({ path: filePath, changeType: "modified", summary: diffSummary.summary });
        changedFiles.push(filePath);
      }
    } else if (entry.a && !entry.b) {
      changes.push({
        path: filePath,
        changeType: "removed",
        summary: "File removed in newer version",
      });
      removedFiles.push(filePath);
    } else if (!entry.a && entry.b) {
      changes.push({ path: filePath, changeType: "added", summary: "File added in newer version" });
      addedFiles.push(filePath);
    }
  }

  return {
    overview: {
      totalFilesCompared: filesMap.size,
      changedFilesCount: changedFiles.length,
      addedFilesCount: addedFiles.length,
      removedFilesCount: removedFiles.length,
    },
    filesSummary: {
      changedFiles,
      addedFiles,
      removedFiles,
    },
    changes,
  };
}

async function extractZip(zipPath: string, label: string) {
  const unzipper = await import("unzipper");
  const destDir = await fs.mkdtemp(path.join(os.tmpdir(), `cmp-${label}-`));

  try {
    const directory = await (unzipper as any).Open.file(zipPath);

    await Promise.all(
      directory.files
        .filter((file: any) => !file.path.endsWith("/"))
        .map(async (file: any) => {
          const target = path.join(destDir, file.path);
          await fs.mkdir(path.dirname(target), { recursive: true });
          const writeStream = (await fs.open(target, "w")).createWriteStream();
          await finished(file.stream().pipe(writeStream));
        }),
    );

    return destDir;
  } catch (err: any) {
    await fs.rm(destDir, { recursive: true, force: true });

    const message = err?.message || "Unknown zip extraction error";
    const knownZipIssues = [
      "FILE_ENDED",
      "invalid signature",
      "invalid central directory",
      "unexpected end of file",
    ];

    if (knownZipIssues.some((needle) => message.toLowerCase().includes(needle.toLowerCase()))) {
      throw new Error(
        "تعذر فك ضغط الملف المضغوط. تأكد أن الملفات بصيغة ZIP سليمة وغير محمية بكلمة مرور، ثم أعد المحاولة.",
      );
    }

    throw err;
  }
}

async function collectFiles(
  root: string,
  current: string,
  map: Map<string, { a?: string; b?: string }>,
  side: "a" | "b",
) {
  const entries = await fs.readdir(current, { withFileTypes: true });

  await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await collectFiles(root, fullPath, map, side);
      } else {
        const relative = path.relative(root, fullPath).replace(/\\/g, "/");
        const existing = map.get(relative) || {};
        existing[side] = fullPath;
        map.set(relative, existing);
      }
    }),
  );
}

async function diffFileContent(pathA: string, pathB: string) {
  const [contentA, contentB] = await Promise.all([
    fs.readFile(pathA, "utf-8"),
    fs.readFile(pathB, "utf-8"),
  ]);

  const diff = diffLines(contentA, contentB);
  let changesCount = 0;
  const summaryParts: string[] = [];

  diff.forEach((part) => {
    if (part.added || part.removed) {
      changesCount += 1;
      const symbol = part.added ? "+" : part.removed ? "-" : " ";
      summaryParts.push(`${symbol} ${truncate(part.value.trim())}`);
    }
  });

  const summary = summaryParts.slice(0, 5).join("\n");

  return { changesCount, summary };
}

function truncate(value: string, max = 120) {
  if (value.length <= max) return value;
  return `${value.slice(0, max)}…`;
}
