import type { ComparisonDoc, ComparisonStatus } from "@/features/user/types/user";

const API_BASE = "/api/user/comparisons";

type ComparisonApiResponse = {
  success?: boolean;
  data?: any;
  error?: string;
};

const statusFallback: ComparisonStatus = "completed";

function normalizeComparison(raw: any): ComparisonDoc {
  if (!raw || typeof raw !== "object") {
    return {
      id: "unknown",
      upload1Id: "",
      upload2Id: "",
    };
  }

  return {
    id: raw.id,
    userId: raw.user_id,
    upload1Id: raw.upload1_id,
    upload2Id: raw.upload2_id,
    backup1Id: raw.backup1_id,
    backup2Id: raw.backup2_id,
    package1Id: raw.package1_id,
    package2Id: raw.package2_id,
    projectId: raw.project_id,
    result: raw.result ?? null,
    status: raw.status ?? statusFallback,
    direction: raw.direction ?? null,
    errorMessage: raw.error_message ?? null,
    createdAt: raw.created_at ?? undefined,
    updatedAt: raw.updated_at ?? undefined,
    metadata: raw.metadata ?? null,
  };
}

async function parseJson(res: Response): Promise<ComparisonApiResponse> {
  try {
    return await res.json();
  } catch {
    return { success: false, error: "Invalid server response" };
  }
}

export async function listComparisonsClient(): Promise<ComparisonDoc[]> {
  const res = await fetch(API_BASE, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to load comparisons (status ${res.status})`);
  }

  const json = await parseJson(res);
  if (json.success === false) {
    throw new Error(json.error || "Failed to load comparisons");
  }

  const items = Array.isArray(json.data) ? json.data : [];
  return items.map(normalizeComparison);
}

export async function createComparisonClient(payload: {
  upload1Id: string;
  upload2Id: string;
  projectId?: string | null;
  result?: any;
}): Promise<ComparisonDoc> {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = await parseJson(res);
  if (!res.ok || json.success === false) {
    throw new Error(json.error || `Failed to create comparison (status ${res.status})`);
  }

  return normalizeComparison(json.data);
}

export async function getComparisonClient(comparisonId: string): Promise<ComparisonDoc | null> {
  const res = await fetch(`${API_BASE}?id=${encodeURIComponent(comparisonId)}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`Failed to fetch comparison (status ${res.status})`);
  }

  const json = await parseJson(res);
  if (json.success === false) {
    throw new Error(json.error || "Failed to fetch comparison");
  }

  if (!json.data) return null;
  return normalizeComparison(json.data);
}

export async function runComparisonClient(payload: {
  upload1Id: string;
  upload2Id: string;
  projectId?: string | null;
}): Promise<ComparisonDoc> {
  const res = await fetch(`${API_BASE}/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = await parseJson(res);
  if (!res.ok || json.success === false) {
    throw new Error(json.error || `Failed to run comparison (status ${res.status})`);
  }

  return normalizeComparison(json.data);
}

export async function listComparisons(): Promise<ComparisonDoc[]> {
  return listComparisonsClient();
}

export async function runComparison(payload: {
  upload1Id: string;
  upload2Id: string;
  projectId?: string | null;
}): Promise<ComparisonDoc> {
  return runComparisonClient(payload);
}
