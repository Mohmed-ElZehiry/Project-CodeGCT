export type AdminRole = "user" | "support" | "admin";

export interface AdminUser {
  id: string;
  email: string;
  fullName?: string | null;
  role: AdminRole;
  status: "active" | "suspended" | "pending";
  createdAt: Date;
  lastSignInAt?: Date | null;
}

export interface UpdateAdminUserPayload {
  role?: AdminRole;
  status?: "active" | "suspended" | "pending";
}

export interface AdminSystemSetting {
  key: string;
  value: unknown;
  category: string;
  editable: boolean;
  updatedAt: Date;
}

export interface AdminAuditLog {
  id: string;
  userId?: string | null;
  action: string;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface AdminDashboardStats {
  totalUsers: number;
  activeUsers: number;
  supportAgents: number;
  pendingInvites: number;
  auditLogCount24h: number;
}

export interface AdminRoleDefinition {
  role: AdminRole;
  description?: string | null;
  permissions: string[];
}
