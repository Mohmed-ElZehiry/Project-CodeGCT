"use client";

import { useAuthorize } from "@/shared/hooks/useAuthorize";
import { AdminSystemSettings } from "@/features/admin";

export default function AdminSystemSettingsPage() {
  useAuthorize({ allow: ["admin"], redirect: "/user/dashboard" });

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-100">إعدادات النظام</h1>
        <p className="text-sm text-slate-400">
          راجع وقم بضبط إعدادات التشغيل العامة وتأكد من تطابقها مع سياسات العمل.
        </p>
      </header>

      <AdminSystemSettings />
    </div>
  );
}
