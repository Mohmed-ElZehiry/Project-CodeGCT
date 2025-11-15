import type { AdminRole, AdminUser, UpdateAdminUserPayload } from "../types/admin";

const BASE_URL = "/api/admin/users";

interface AdminUserResponse {
  id: string;
  email: string;
  full_name?: string | null;
  role: AdminRole;
  status: "active" | "suspended" | "pending";
  created_at: string;
  last_sign_in_at?: string | null;
}

interface ApiPayload<T> {
  success: boolean;
  data?: T;
  error?: string;
}

function mapAdminUser(response: AdminUserResponse): AdminUser {
  return {
    id: response.id,
    email: response.email,
    fullName: response.full_name ?? null,
    role: response.role,
    status: response.status,
    createdAt: new Date(response.created_at),
    lastSignInAt: response.last_sign_in_at ? new Date(response.last_sign_in_at) : null,
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

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  const res = await fetch(BASE_URL, { cache: "no-store" });
  const data = await parseResponse<AdminUserResponse[]>(res);
  return (data ?? []).map(mapAdminUser);
}

export async function updateAdminUser(
  userId: string,
  payload: UpdateAdminUserPayload,
): Promise<AdminUser> {
  const res = await fetch(`${BASE_URL}/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await parseResponse<AdminUserResponse>(res);
  return mapAdminUser(data);
}
