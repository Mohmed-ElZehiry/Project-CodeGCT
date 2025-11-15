import type { Database } from "@/lib/supabase/database.types";

export type AppRole = Database["public"]["Enums"]["user_role"];

type PermissionEntry = {
  routes: string[];
  actions: string[];
};

type RolePermissionMap = Record<AppRole, PermissionEntry>;

export const rolePermissions: RolePermissionMap = {
  user: {
    routes: [
      "/user/dashboard",
      "/user/dashboard/uploads",
      "/user/dashboard/reports",
      "/user/dashboard/analyze",
      "/user/dashboard/archive",
      "/user/settings",
    ],
    actions: ["upload", "analyze", "view_reports", "manage_settings"],
  },
  support: {
    routes: ["/support/dashboard", "/support/dashboard/support_reports"],
    actions: ["view_support_cases", "view_reports", "assist_users"],
  },
  admin: {
    routes: [
      "/admin/dashboard",
      "/admin/dashboard/user-management",
      "/admin/dashboard/system_settings",
      "/admin/dashboard/logs",
      "/admin/dashboard/analytics",
    ],
    actions: ["manage_users", "edit_roles", "view_admin_reports", "configure_system"],
  },
};

function normalizePath(pathname: string): string {
  // Strip leading /{locale} segment (e.g., /en, /ar) so permission routes stay locale-agnostic
  return pathname.replace(/^\/[a-z]{2}(?=\/)/i, "");
}

export function isRouteAllowed(role: AppRole, pathname: string): boolean {
  const entry = rolePermissions[role];
  const normalized = normalizePath(pathname);
  return entry.routes.some((route) => normalized.startsWith(route));
}
