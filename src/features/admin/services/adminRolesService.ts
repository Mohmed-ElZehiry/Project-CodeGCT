import type { AdminRole } from "../types/admin";

const BASE_URL = "/api/admin/roles";

interface RoleResponse {
  role: AdminRole;
  description?: string | null;
  permissions: string[];
}

interface ApiPayload<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function parseResponse<T>(res: Response): Promise<T> {
  const payload = (await res.json().catch(() => null)) as ApiPayload<T> | null;

  if (!res.ok || !payload?.success) {
    const errorMessage = payload?.error || `Request failed with status ${res.status}`;
    throw new Error(errorMessage);
  }

  return payload.data as T;
}

export async function fetchAdminRoles(): Promise<RoleResponse[]> {
  const res = await fetch(BASE_URL, { cache: "no-store" });
  return parseResponse<RoleResponse[]>(res);
}

export async function updateAdminRolePermissions(
  role: AdminRole,
  permissions: string[],
  description?: string | null,
): Promise<RoleResponse> {
  const res = await fetch(`${BASE_URL}/${role}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ permissions, description }),
  });

  return parseResponse<RoleResponse>(res);
}
