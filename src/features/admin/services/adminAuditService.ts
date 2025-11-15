const BASE_URL = "/api/admin/audit-logs";

export interface AuditLog {
  id: string;
  userId?: string | null;
  action: string;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
}

interface AuditLogResponse {
  id: string;
  userId?: string | null;
  action: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

interface ApiPayload<T> {
  success: boolean;
  data?: T;
  error?: string;
}

function mapAuditLog(entry: AuditLogResponse): AuditLog {
  return {
    id: entry.id,
    userId: entry.userId ?? null,
    action: entry.action,
    metadata: entry.metadata ?? null,
    createdAt: new Date(entry.createdAt),
    ipAddress: entry.ipAddress ?? null,
    userAgent: entry.userAgent ?? null,
  };
}

async function parseResponse<T>(res: Response): Promise<T> {
  const payload = (await res.json().catch(() => null)) as ApiPayload<T> | null;

  if (!res.ok || !payload?.success) {
    const errorMessage = payload?.error || `Request failed with status ${res.status}`;
    throw new Error(errorMessage);
  }

  return payload.data as T;
}

export async function fetchAuditLogs(params?: {
  userId?: string;
  limit?: number;
}): Promise<AuditLog[]> {
  const searchParams = new URLSearchParams();
  if (params?.userId) searchParams.set("userId", params.userId);
  if (params?.limit) searchParams.set("limit", String(params.limit));

  const res = await fetch(`${BASE_URL}${searchParams.toString() ? `?${searchParams}` : ""}`, {
    cache: "no-store",
  });
  const data = await parseResponse<AuditLogResponse[]>(res);
  return (data ?? []).map(mapAuditLog);
}
