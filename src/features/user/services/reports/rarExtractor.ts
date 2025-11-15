"use server";

import path from "path";
import fs from "fs/promises";
import { logError, logDebug } from "@/lib/utils/logger";

let cachedCreateExtractor: ((args: { filepath: string }) => any) | undefined;
let modulePromise: Promise<any> | null = null;

const moduleLoaders: Array<() => Promise<any>> = [
  () => import("node-unrar-js"),
  () => import("node-unrar-js/dist/index.js"),
  () => import("node-unrar-js/dist/index"),
  () => import("node-unrar-js/esm/index.js"),
];

async function loadNodeUnrarModule() {
  if (!modulePromise) {
    modulePromise = (async () => {
      let lastError: unknown;
      for (const loader of moduleLoaders) {
        try {
          const mod = await loader();
          if (mod) {
            return mod;
          }
        } catch (err) {
          lastError = err;
          logDebug("Failed to import node-unrar-js candidate", {
            error: (err as Error)?.message,
          });
        }
      }
      throw new Error(
        `Unable to load node-unrar-js module. Last error: ${(lastError as Error)?.message ?? "unknown"}`,
      );
    })();
  }
  return modulePromise;
}

async function getCreateExtractorFromFile() {
  if (cachedCreateExtractor) {
    return cachedCreateExtractor;
  }

  const module = await loadNodeUnrarModule();
  const candidate =
    (module as any)?.createExtractorFromFile ??
    (module as any)?.default?.createExtractorFromFile ??
    (typeof module === "function" ? module : undefined);

  if (typeof candidate !== "function") {
    logError("node-unrar-js createExtractorFromFile export not available", {
      type: typeof module,
      keys: module ? Object.keys(module as any) : [],
      defaultType: typeof (module as any)?.default,
      defaultKeys: (module as any)?.default ? Object.keys((module as any).default) : [],
    });
    throw new Error("node-unrar-js createExtractorFromFile export not available");
  }

  cachedCreateExtractor = candidate;
  return cachedCreateExtractor;
}

function resolveSafeExtractionPath(rootDir: string, entryPath: string): string {
  const normalizedRoot = path.resolve(rootDir);
  const stripped = entryPath.replace(/^[A-Za-z]:/i, "").replace(/^\\+|^\/+/, "");
  const resolved = path.resolve(normalizedRoot, stripped);

  if (!resolved.startsWith(`${normalizedRoot}${path.sep}`) && resolved !== normalizedRoot) {
    throw new Error(`RAR entry resolves outside extraction dir: ${entryPath}`);
  }

  return resolved;
}

async function collectExtractedFilePaths(rootDir: string): Promise<string[]> {
  const results: string[] = [];
  const normalizedRoot = path.resolve(rootDir);

  async function walk(current: string) {
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      const resolved = path.resolve(fullPath);

      if (!resolved.startsWith(normalizedRoot)) {
        logError("RAR extraction discovered path outside root", {
          entry: resolved,
          root: normalizedRoot,
        });
        continue;
      }

      if (entry.isDirectory()) {
        await walk(fullPath);
      } else {
        results.push(resolved);
      }
    }
  }

  await walk(normalizedRoot);
  return results;
}

export async function extractRarArchive(archivePath: string, destDir: string): Promise<string[]> {
  const createExtractorFromFile = await getCreateExtractorFromFile();
  if (!createExtractorFromFile) {
    throw new Error("node-unrar-js createExtractorFromFile is unavailable");
  }

  await fs.mkdir(destDir, { recursive: true });

  const extractorCandidate = createExtractorFromFile({ filepath: archivePath });
  const extractor =
    extractorCandidate && typeof extractorCandidate.then === "function"
      ? await extractorCandidate
      : extractorCandidate;

  if (!extractor || typeof extractor.extract !== "function") {
    throw new Error("node-unrar-js extractor.extract method not available");
  }

  const extractionResult = extractor.extract({ targetPath: destDir }) ?? {};
  const rawFiles = Array.isArray(extractionResult.files) ? extractionResult.files : [];
  logDebug("RAR extraction result", {
    archivePath,
    fileCount: rawFiles.length,
    keys: extractionResult ? Object.keys(extractionResult) : [],
  });
  const extractedFiles: string[] = [];

  for (const file of rawFiles) {
    const header = file?.fileHeader ?? {};
    const isDirectory = Boolean(header?.flags?.directory);
    if (isDirectory) continue;

    const fileName = header?.name ?? "";
    if (!fileName) continue;

    let safePath: string;
    try {
      safePath = resolveSafeExtractionPath(destDir, fileName);
    } catch (err) {
      logError("Skipped RAR entry outside extraction dir", {
        entry: fileName,
        error: (err as Error).message,
      });
      continue;
    }

    logDebug("Processing RAR entry", {
      entry: fileName,
      compressedSize: header?.compressedSize ?? header?.packSize,
      uncompressedSize: header?.uncompressedSize ?? header?.unpSize,
      hasExtract: typeof (file as any)?.extract,
    });

    await fs.mkdir(path.dirname(safePath), { recursive: true });

    let raw: unknown = (file as any)?.extract;
    if (typeof raw === "function") {
      try {
        raw = raw();
        if (raw && typeof (raw as any)?.then === "function") {
          raw = await (raw as Promise<unknown>);
        }
      } catch (err) {
        logError("Failed to invoke extract() on RAR entry", {
          entry: fileName,
          error: (err as Error).message,
        });
        continue;
      }
    }

    let buffers: Buffer[] = [];

    if (raw instanceof Uint8Array) {
      buffers = [Buffer.from(raw)];
    } else if (Array.isArray(raw)) {
      const chunkBuffers = (raw as unknown[])
        .flatMap((chunk) => {
          if (chunk instanceof Uint8Array) return [Buffer.from(chunk)];
          if (Array.isArray(chunk)) {
            return (chunk as unknown[])
              .filter((inner) => inner instanceof Uint8Array)
              .map((inner) => Buffer.from(inner as Uint8Array));
          }
          if (chunk && typeof chunk === "object" && (chunk as any).data instanceof Uint8Array) {
            return [Buffer.from((chunk as any).data as Uint8Array)];
          }
          return [] as Buffer[];
        })
        .filter(Boolean) as Buffer[];
      buffers = chunkBuffers;
    } else if (raw && typeof raw === "object") {
      if ((raw as any).data instanceof Uint8Array) {
        buffers = [Buffer.from((raw as any).data as Uint8Array)];
      } else if (
        Array.isArray((raw as any)[1]) &&
        (raw as any)[1].every((item: unknown) => item instanceof Uint8Array)
      ) {
        buffers = ((raw as any)[1] as Uint8Array[]).map((chunk) => Buffer.from(chunk));
      }
    }

    if (!buffers.length) {
      logDebug("RAR entry produced no buffer chunks", {
        entry: fileName,
        rawType: typeof raw,
        hasDataProp: Boolean(raw && typeof raw === "object" && (raw as any).data),
        arrayLength: Array.isArray(raw) ? (raw as unknown[]).length : undefined,
      });
      continue;
    }

    try {
      await fs.writeFile(safePath, Buffer.concat(buffers));
      extractedFiles.push(safePath);
    } catch (err) {
      logError("Failed to write extracted RAR entry", {
        entry: fileName,
        error: (err as Error).message,
      });
    }
  }

  if (!extractedFiles.length) {
    const collected = await collectExtractedFilePaths(destDir);
    if (!collected.length) {
      logDebug("RAR extraction finished with no files written", { archivePath, destDir });
    }
    return collected;
  }

  return extractedFiles;
}
