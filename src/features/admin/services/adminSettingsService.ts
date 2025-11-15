import type { AdminSystemSetting } from "../types/admin";

const BASE_URL = "/api/admin/system_settings";

interface SystemSettingResponse {
  key: string;
  value: unknown;
  category: string;
  editable: boolean;
  updatedAt: string;
}

interface ApiPayload<T> {
  success: boolean;
  data?: T;
  error?: string;
}

function mapSetting(response: SystemSettingResponse): AdminSystemSetting {
  return {
    key: response.key,
    value: response.value,
    category: response.category,
    editable: response.editable,
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

export async function fetchAdminSystemSettings(): Promise<AdminSystemSetting[]> {
  const res = await fetch(BASE_URL, { cache: "no-store" });
  const data = await parseResponse<SystemSettingResponse[]>(res);
  return (data ?? []).map(mapSetting);
}

export async function updateAdminSystemSetting(
  key: string,
  value: unknown,
): Promise<AdminSystemSetting> {
  const res = await fetch(`${BASE_URL}/${encodeURIComponent(key)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ value }),
  });

  const data = await parseResponse<SystemSettingResponse>(res);
  return mapSetting(data);
}
