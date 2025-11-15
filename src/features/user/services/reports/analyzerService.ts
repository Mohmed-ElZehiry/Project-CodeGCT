// src/features/user/services/reports/analyzerService.ts
"use server";

import type {
  AnalysisReport,
  ReportOverview,
  ReportStructure,
  ReportDependencies,
  ReportDependencyItem,
  ReportSections,
  ReportInsights,
} from "../../types/user";

export type AnalyzerFile = {
  name: string;
  content?: string;
};

export async function generateReportFromFiles(
  files: AnalyzerFile[],
  options?: { userId?: string; projectId?: string; name?: string },
): Promise<AnalysisReport> {
  const overview = buildOverview(files);
  const structure = buildStructure(files);
  const dependencies = buildDependencies(files);
  const sections: ReportSections = {}; // placeholder for future enriched sections
  const insights = buildInsights({ overview, structure, dependencies });

  const now = new Date().toISOString();

  const report: AnalysisReport = {
    id: `temp-${Date.now()}`,
    name: options?.name ?? `Analysis-${Date.now()}`,
    userId: options?.userId ?? "unknown-user",
    projectId: options?.projectId,
    status: "completed",
    format: "json",
    createdAt: now,
    updatedAt: now,
    overview,
    structure,
    dependencies,
    sections,
    insights,
    content: {
      files,
      overview,
      structure,
      dependencies,
      sections,
      insights,
    },
  };

  return report;
}

/* -------- helpers ---------- */

function buildOverview(files: AnalyzerFile[]): ReportOverview {
  return {
    language: detectLanguage(files),
    frameworks: detectFrameworks(files),
    libraries: [], // can be filled from dependencies or code scanning later
  };
}

function buildStructure(files: AnalyzerFile[]): ReportStructure {
  return {
    tree: files.map((f) => f.name),
    description: "Project file structure extracted from provided files.",
  };
}

function buildDependencies(files: AnalyzerFile[]): ReportDependencies {
  const items: ReportDependencyItem[] = extractDependencies(files);
  return { list: items };
}

function buildInsights({
  overview,
  structure,
  dependencies,
}: {
  overview: ReportOverview;
  structure: ReportStructure;
  dependencies: ReportDependencies;
}): ReportInsights {
  const warnings: string[] = [];
  const recommendations: string[] = [];

  if (!overview.language) {
    warnings.push("Unable to detect primary language.");
    recommendations.push("Ensure source files include recognizable extensions (.ts, .js, etc.).");
  }

  if (structure.tree.length === 0) {
    warnings.push("No files detected in structure.");
    recommendations.push("Provide a minimal set of project files for analysis.");
  }

  if (!dependencies.list.length) {
    recommendations.push("Consider including package.json for accurate dependency detection.");
  }

  return { warnings, recommendations };
}

/* -------- detectors ---------- */

function detectLanguage(files: AnalyzerFile[]): string | null {
  if (files.some((f) => f.name.endsWith(".ts") || f.name.endsWith(".tsx"))) return "TypeScript";
  if (files.some((f) => f.name.endsWith(".js") || f.name.endsWith(".jsx"))) return "JavaScript";
  if (files.some((f) => f.name.endsWith(".py"))) return "Python";
  return null;
}

function detectFrameworks(files: AnalyzerFile[]): string[] {
  const frameworks: string[] = [];
  const contentIncludes = (needle: string) =>
    files.some((f) => (f.content || "").toLowerCase().includes(needle.toLowerCase()));
  const nameIncludes = (needle: string) =>
    files.some((f) => f.name.toLowerCase().includes(needle.toLowerCase()));

  if (nameIncludes("next.config") || contentIncludes("next")) frameworks.push("Next.js");
  if (contentIncludes("react") || nameIncludes("jsx") || nameIncludes("tsx"))
    frameworks.push("React");
  if (contentIncludes("express")) frameworks.push("Express");
  if (contentIncludes("@nestjs")) frameworks.push("NestJS");

  return frameworks;
}

function extractDependencies(files: AnalyzerFile[]): ReportDependencyItem[] {
  const pkg = files.find((f) => f.name === "package.json" && f.content);
  if (!pkg?.content) return [];
  try {
    const parsed = JSON.parse(pkg.content);
    const deps = Object.entries(parsed.dependencies || {}).map(([name, version]) => ({
      name,
      version: String(version),
      type: "prod" as const,
    }));
    const devDeps = Object.entries(parsed.devDependencies || {}).map(([name, version]) => ({
      name,
      version: String(version),
      type: "dev" as const,
    }));

    // naive unused detection placeholder
    const used = new Set<string>();
    files.forEach((f) => {
      const c = (f.content || "").toLowerCase();
      [...deps, ...devDeps].forEach((d) => {
        if (c.includes(d.name.toLowerCase())) used.add(d.name);
      });
    });
    const tagged = [...deps, ...devDeps].map((d) =>
      used.has(d.name) ? d : { ...d, type: d.type },
    );

    return tagged;
  } catch {
    return [];
  }
}
