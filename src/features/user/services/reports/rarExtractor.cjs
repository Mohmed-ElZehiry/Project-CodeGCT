const path = require("path");
const fs = require("fs/promises");

let unrarModule;
let lastError;

try {
  unrarModule = require("node-unrar-js");
} catch (errPrimary) {
  lastError = errPrimary;
  try {
    unrarModule = require("node-unrar-js/dist/index.js");
  } catch (errDistJs) {
    lastError = errDistJs;
    try {
      unrarModule = require("node-unrar-js/dist/index");
    } catch (errDist) {
      lastError = errDist;
      try {
        unrarModule = require("node-unrar-js/esm/index.js");
      } catch (errEsm) {
        lastError = errEsm;
      }
    }
  }
}

if (!unrarModule) {
  throw new Error(
    `Unable to load node-unrar-js module. Last error: ${lastError?.message ?? "unknown"}`
  );
}

const createExtractorFromFile =
  (unrarModule && unrarModule.createExtractorFromFile) ||
  (unrarModule && unrarModule.default && unrarModule.default.createExtractorFromFile) ||
  (typeof unrarModule === "function" ? unrarModule : undefined);

if (typeof createExtractorFromFile !== "function") {
  const availableKeys = unrarModule ? Object.keys(unrarModule) : [];
  console.error(
    "[rarExtractor] node-unrar-js module introspection",
    {
      type: typeof unrarModule,
      keys: availableKeys,
      defaultType: typeof unrarModule?.default,
      defaultKeys: unrarModule?.default ? Object.keys(unrarModule.default) : [],
    }
  );
  throw new Error(
    `node-unrar-js createExtractorFromFile export not available (keys: ${availableKeys.join(",")})`
  );
}

async function extractRarArchive(archivePath, destDir) {
  const extractorCandidate = createExtractorFromFile({ filepath: archivePath });
  const extractor =
    extractorCandidate && typeof extractorCandidate.then === "function"
      ? await extractorCandidate
      : extractorCandidate;

  if (!extractor || typeof extractor.extract !== "function") {
    throw new Error("node-unrar-js extractor.extract method not available");
  }

  const extractionResult = extractor.extract({ targetPath: destDir });
  const { files } = extractionResult;
  const extractedFiles = [];

  for (const file of files) {
    const header = file.fileHeader || {};
    const isDirectory = Boolean(header.flags && header.flags.directory);
    if (isDirectory) continue;

    const fileName = header.name;
    if (!fileName) continue;

    const filePath = path.join(destDir, fileName);
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    const raw = file.extract;
    const chunks = [];

    if (raw instanceof Uint8Array) {
      chunks.push(raw);
    } else if (Array.isArray(raw)) {
      for (const piece of raw) {
        if (piece instanceof Uint8Array) {
          chunks.push(piece);
        }
      }
    }

    if (!chunks.length) continue;

    await fs.writeFile(filePath, Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))));
    extractedFiles.push(filePath);
  }

  return extractedFiles;
}

module.exports = {
  extractRarArchive,
};
