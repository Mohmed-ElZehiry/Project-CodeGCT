import type { SupportReport } from "../types/support";

const BASE_URL = "/api/support/reports";

type SupportStatus = SupportReport["status"];
type SupportPriority = SupportReport["priority"];

interface SupportReportResponse {
  id: string;
  userId: string | null;
  title: string;
  description: string | null;
  status: SupportStatus;
  priority: SupportPriority;
  createdAt: string;
  updatedAt: string;
}

interface ApiPayload<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface FetchReportsParams {
  status?: SupportStatus;
  priority?: SupportPriority;
  userId?: string;
}

interface CreateReportPayload {
  title: string;
  description?: string;
  priority?: SupportPriority;
}

interface UpdateReportPayload {
  title?: string;
  description?: string | null;
  status?: SupportStatus;
  priority?: SupportPriority;
}

function mapReport(response: SupportReportResponse): SupportReport {
  return {
    id: response.id,
    userId: response.userId,
    title: response.title,
    description: response.description ?? undefined,
    status: response.status,
    priority: response.priority,
    createdAt: new Date(response.createdAt),
    updatedAt: new Date(response.updatedAt),
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

function toQuery(params?: FetchReportsParams) {
  if (!params) return "";
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.set("status", params.status);
  if (params.priority) searchParams.set("priority", params.priority);
  if (params.userId) searchParams.set("userId", params.userId);
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

export async function fetchReports(params?: FetchReportsParams): Promise<SupportReport[]> {
  const res = await fetch(`${BASE_URL}${toQuery(params)}`, { cache: "no-store" });
  const data = await parseResponse<SupportReportResponse[]>(res);
  return (data ?? []).map(mapReport);
}

export async function fetchReport(id: string): Promise<SupportReport> {
  const res = await fetch(`${BASE_URL}/${id}`, { cache: "no-store" });
  const data = await parseResponse<SupportReportResponse>(res);
  return mapReport(data);
}

export async function createReport(payload: CreateReportPayload): Promise<SupportReport> {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await parseResponse<SupportReportResponse>(res);
  return mapReport(data);
}

export async function updateReport(
  id: string,
  payload: UpdateReportPayload,
): Promise<SupportReport> {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await parseResponse<SupportReportResponse>(res);
  return mapReport(data);
}

export async function deleteReport(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/${id}`, { method: "DELETE" });
  await parseResponse<null>(res);
}

export type { FetchReportsParams, CreateReportPayload, UpdateReportPayload };
