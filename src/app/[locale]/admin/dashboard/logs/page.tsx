"use client";

import { useAuthorize } from "@/shared/hooks/useAuthorize";
import { AdminAuditLogs } from "@/features/admin";

export default function AdminAuditLogsPage() {
  useAuthorize({ allow: ["admin"], redirect: "/user/dashboard" });

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-100">سجلات النظام</h1>
        <p className="text-sm text-slate-400">
          استعرض أحدث عمليات التدقيق، راقب الأحداث الحساسة، وتابع نشاط المستخدمين.
        </p>
      </header>

      <AdminAuditLogs />
    </div>
  );
}
