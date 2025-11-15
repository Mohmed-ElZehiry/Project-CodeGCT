"use server";

import path from "path";
import fs from "fs/promises";
import os from "os";
import { Readable } from "stream";
import { finished } from "stream/promises";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { addStep } from "@/features/user/services/uploads/uploadStepsService";
import { logInfo, logError, logDebug, logWarn } from "@/lib/utils/logger";
import type { AnalysisReport } from "@/features/user/types/user";
import { generateReportFromFiles, type AnalyzerFile } from "./analyzerService";
import { extractRarArchive } from "./rarExtractor";

const ALLOWED_ARCHIVE_EXT = ["zip", "rar"]; // extend when additional formats are implemented

export type PipelineResult = {
  report: AnalysisReport;
};

/**
 * Downloads the uploaded archive from its remote URL into a local temp directory.
 */
const DOWNLOAD_TIMEOUT_MS = 30_000;
const DOWNLOAD_MAX_ATTEMPTS = 3;
const DOWNLOAD_RETRY_BASE_DELAY_MS = 2_000;

async function downloadArchive(
  downloadUrl: string,
  filename: string,
  destDir: string,
): Promise<string> {
  const targetPath = path.join(destDir, filename);
  let lastError: unknown;

  for (let attempt = 1; attempt <= DOWNLOAD_MAX_ATTEMPTS; attempt++) {
    logDebug("Downloading archive", { downloadUrl, targetPath, attempt });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);

    try {
      const response = await fetch(downloadUrl, { signal: controller.signal });
      clearTimeout(timeout);

      if (!response.ok || !response.body) {
        throw new Error(`Download failed with status ${response.status}`);
      }

      const writeStream = (await fs.open(targetPath, "w")).createWriteStream();
      try {
        await finished(Readable.fromWeb(response.body as any).pipe(writeStream));
      } catch (streamErr) {
        await fs.rm(targetPath, { force: true }).catch(() => undefined);
        throw streamErr;
      }

      return targetPath;
    } catch (err) {
      clearTimeout(timeout);
      lastError = err;
      logWarn("Archive download attempt failed", {
        downloadUrl,
        attempt,
        maxAttempts: DOWNLOAD_MAX_ATTEMPTS,
        error: err instanceof Error ? err.message : String(err),
      });

      await fs.rm(targetPath, { force: true }).catch(() => undefined);

      if (attempt < DOWNLOAD_MAX_ATTEMPTS) {
        const backoff = DOWNLOAD_RETRY_BASE_DELAY_MS * attempt;
        await new Promise((resolve) => setTimeout(resolve, backoff));
      }
    }
  }

  throw new Error(
    `Unable to download archive after ${DOWNLOAD_MAX_ATTEMPTS} attempts: ${
      lastError instanceof Error ? lastError.message : "Unknown error"
    }`,
  );
}

/**
 * Extracts a zip archive into the destination directory.
 */
function resolveSafeExtractionPath(rootDir: string, entryPath: string): string {
  const normalizedRoot = path.resolve(rootDir);
  const stripped = entryPath.replace(/^[A-Za-z]:/i, "").replace(/^\\+|^\/+/, "");
  const resolved = path.resolve(normalizedRoot, stripped);
  if (!resolved.startsWith(`${normalizedRoot}${path.sep}`) && resolved !== normalizedRoot) {
    throw new Error(`Archive entry resolves outside extraction dir: ${entryPath}`);
  }
  return resolved;
}

async function extractZipArchive(archivePath: string, destDir: string): Promise<string[]> {
  const unzipperModule = await import("unzipper");
  const Open = (unzipperModule as any).Open ?? unzipperModule?.default?.Open;
  if (!Open?.file) {
    throw new Error("unzipper Open.file export not available");
  }

  const directory = await Open.file(archivePath);
  const extractedFiles: string[] = [];

  await Promise.all(
    directory.files
      .filter((file: any) => !file.path.endsWith("/"))
      .map(async (file: any) => {
        const filePath = resolveSafeExtractionPath(destDir, file.path);
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        const writeStream = (await fs.open(filePath, "w")).createWriteStream();
        await finished(file.stream().pipe(writeStream));
        extractedFiles.push(filePath);
      }),
  );

  return extractedFiles;
}

async function extractArchive(archivePath: string, destDir: string): Promise<string[]> {
  const ext = path.extname(archivePath).replace(/\./, "").toLowerCase();

  if (!ALLOWED_ARCHIVE_EXT.includes(ext)) {
    throw new Error(`Unsupported archive format: ${ext}`);
  }

  if (ext === "zip") {
    return extractZipArchive(archivePath, destDir);
  }

  if (ext === "rar") {
    throw new Error(
      "RAR archives are not supported at the moment. Please upload the project as a ZIP archive instead.",
    );
  }

  // Fallback safeguard (should not be reachable because of ALLOWED_ARCHIVE_EXT)
  throw new Error(`Archive format ${ext} is not yet supported by the analysis pipeline`);
}

async function collectAnalyzerFiles(files: string[], rootDir: string): Promise<AnalyzerFile[]> {
  const results = await Promise.all<AnalyzerFile | null>(
    files.map(async (filePath) => {
      const relative = path.relative(rootDir, filePath).replace(/\\/g, "/");

      try {
        const buffer = await fs.readFile(filePath);
        const size = buffer.length;

        if (size > 1024 * 1024 * 2) {
          return { name: relative, content: `/* file too large (${size} bytes) */` };
        }

        return { name: relative, content: buffer.toString("utf-8") };
      } catch (err: any) {
        logWarnRead(relative, err);
        return null;
      }
    }),
  );

  return results.filter((item): item is AnalyzerFile => item !== null);
}

function logWarnRead(file: string, err: Error) {
  logError("Failed to read extracted file", { file, error: err.message });
}

function parseStoredContent(rawContent: unknown): unknown {
  if (typeof rawContent === "string") {
    try {
      return JSON.parse(rawContent);
    } catch (err) {
      logDebug("Unable to parse stored report content", { error: (err as Error).message });
      return rawContent;
    }
  }
  return rawContent ?? null;
}

function mapRowToAnalysisReport(row: any): AnalysisReport {
  return {
    id: row.id,
    name: row.name,
    userId: row.user_id,
    uploadId: row.upload_id ?? undefined,
    projectId: row.project_id ?? undefined,
    backupId: row.backup_id ?? undefined,
    status: row.status,
    format: row.format,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? undefined,
    overview: row.overview ?? undefined,
    structure: row.structure ?? undefined,
    dependencies: row.dependencies ?? undefined,
    sections: row.sections ?? undefined,
    insights: row.insights ?? undefined,
    content: parseStoredContent(row.content),
  };
}

async function persistAnalysisResult(
  report: AnalysisReport,
  uploadId: string,
  projectId: string | null,
  userId: string,
) {
  const supabase = await createSupabaseServerClient();
  const sanitizedName = report.name ?? `Analysis-${uploadId}`;
  const insertPayload: any = {
    name: sanitizedName,
    user_id: userId,
    project_id: projectId ?? null,
    upload_id: uploadId,
    status: report.status,
    format: report.format,
    content:
      typeof report.content === "string" ? report.content : JSON.stringify(report.content ?? {}),
    overview: report.overview,
    structure: report.structure,
    dependencies: report.dependencies,
    sections: report.sections,
    insights: report.insights,
    created_at: report.createdAt,
    updated_at: report.updatedAt,
  };

  const { data, error } = await supabase
    .from("analysis_reports")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to persist analysis report");
  }

  return mapRowToAnalysisReport(data);
}

export async function runAnalysisPipeline({
  uploadId,
  userId,
  projectId,
  downloadUrl,
  archiveFilename,
}: {
  uploadId: string;
  userId: string;
  projectId?: string | null;
  downloadUrl: string;
  archiveFilename: string;
}): Promise<PipelineResult> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "analysis-"));
  const extractDir = path.join(tmpDir, "extracted");
  await fs.mkdir(extractDir, { recursive: true });

  logInfo("Starting analysis pipeline", { uploadId, projectId });

  try {
    await addStep(
      uploadId,
      "analysis",
      { message: "Downloading archive" },
      "pipeline",
      downloadUrl,
      "running",
    );
    const archivePath = await downloadArchive(downloadUrl, archiveFilename, tmpDir);

    await addStep(
      uploadId,
      "analysis",
      { message: "Extracting archive" },
      "pipeline",
      undefined,
      "running",
    );
    const extractedPaths = await extractArchive(archivePath, extractDir);

    await addStep(
      uploadId,
      "analysis",
      { message: "Reading files" },
      "pipeline",
      undefined,
      "running",
    );
    const analyzerFiles = await collectAnalyzerFiles(extractedPaths, extractDir);

    await addStep(
      uploadId,
      "analysis",
      { message: "Generating report" },
      "pipeline",
      undefined,
      "running",
    );
    const report = await generateReportFromFiles(analyzerFiles, {
      userId,
      projectId: projectId ?? undefined,
      name: `Analysis-${archiveFilename}`,
    });

    await addStep(
      uploadId,
      "analysis",
      { message: "Persisting report" },
      "pipeline",
      undefined,
      "running",
    );
    const persisted = await persistAnalysisResult(report, uploadId, projectId ?? null, userId);

    await addStep(
      uploadId,
      "analysis",
      { message: "Analysis completed" },
      "pipeline",
      undefined,
      "done",
    );

    logInfo("Analysis pipeline finished", {
      uploadId,
      reportId: persisted.id,
      extractedFileCount: extractedPaths.length,
      analyzedFileCount: analyzerFiles.length,
    });

    return { report: persisted };
  } catch (err: any) {
    logError("Analysis pipeline failed", { uploadId, error: err?.message });
    await addStep(uploadId, "analysis", { error: err?.message }, "pipeline", undefined, "error");
    throw err;
  } finally {
    try {
      await fs.unlink(path.join(tmpDir, archiveFilename)).catch(() => undefined);
    } catch (err) {
      logDebug("Unable to unlink archive", { uploadId, error: (err as Error).message });
    }

    try {
      await fs.rm(extractDir, { recursive: true, force: true });
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch (err) {
      logDebug("Unable to clean temp directories", { uploadId, error: (err as Error).message });
    }
  }
}
