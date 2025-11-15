"use client";

import { useAuthorize } from "@/shared/hooks/useAuthorize";
import { AdminUsersTable } from "@/features/admin";

export default function AdminUsersPage() {
  useAuthorize({ allow: ["admin"], redirect: "/user/dashboard" });

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-100">إدارة المستخدمين</h1>
        <p className="text-sm text-slate-400">
          تحكم في أدوار وحالات أعضاء المنصة وتابع أحدث الأنشطة لكل مستخدم.
        </p>
      </header>

      <AdminUsersTable />
    </div>
  );
}
