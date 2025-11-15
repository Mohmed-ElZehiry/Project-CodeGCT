"use client";

import { useMemo, useState } from "react";
import { useAdminAuditLogsQuery } from "../hooks/adminUseAuditLogs";
import type { AuditLog } from "../services/adminAuditService";
import { logError } from "@/lib/utils/logger";

type AdminAuditLogsProps = {
  defaultUserId?: string;
};

export default function AdminAuditLogs({ defaultUserId }: AdminAuditLogsProps) {
  const [userFilter, setUserFilter] = useState(defaultUserId ?? "");
  const { data, isLoading, isError, error, refetch, isFetching } = useAdminAuditLogsQuery(
    { userId: userFilter || undefined, limit: 100 },
    {
      onError: (err: Error) => {
        logError("admin.auditLogs: failed to fetch", {
          error: err.message,
          userId: userFilter || null,
        });
      },
    },
  );

  const logs = useMemo(() => data ?? [], [data]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <label htmlFor="audit-user-filter" className="text-sm text-slate-300">
            فلترة حسب المستخدم:
          </label>
          <input
            id="audit-user-filter"
            value={userFilter}
            onChange={(event) => setUserFilter(event.target.value)}
            placeholder="أدخل معرف المستخدم..."
            className="w-56 rounded-md border border-slate-700 bg-slate-900/70 px-3 py-1 text-sm text-slate-200"
          />
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="self-start rounded border border-slate-600 px-3 py-1 text-xs text-slate-200 hover:bg-slate-800"
        >
          تحديث السجلات
        </button>
      </div>

      {isFetching && <p className="text-xs text-slate-500">🔄 يتم تحديث السجلات...</p>}

      {isLoading ? (
        <p className="text-blue-400">⏳ جاري تحميل السجلات...</p>
      ) : isError ? (
        <div className="space-y-3 text-red-400">
          <p>❌ حدث خطأ أثناء جلب السجلات: {error?.message ?? "خطأ غير معروف"}</p>
          <button
            type="button"
            className="rounded border border-red-500/40 px-3 py-1 text-sm hover:bg-red-500/10"
            onClick={() => refetch()}
          >
            إعادة المحاولة
          </button>
        </div>
      ) : logs.length === 0 ? (
        <p className="text-slate-400">⚠️ لا توجد سجلات للعرض.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
          <table className="min-w-full border-collapse text-sm text-slate-200">
            <thead className="bg-slate-900/70 text-left text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3">🆔 المعرّف</th>
                <th className="px-4 py-3">👤 المستخدم</th>
                <th className="px-4 py-3">⚡ الحدث</th>
                <th className="px-4 py-3">📍 عنوان IP</th>
                <th className="px-4 py-3">🖥️ جهاز</th>
                <th className="px-4 py-3">📦 البيانات</th>
                <th className="px-4 py-3">⏰ التوقيت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {logs.map((log) => (
                <LogRow key={log.id} log={log} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function LogRow({ log }: { log: AuditLog }) {
  return (
    <tr className="hover:bg-slate-800/40">
      <td className="px-4 py-3 font-mono text-xs text-slate-500">{log.id}</td>
      <td className="px-4 py-3 text-sm text-slate-200">{log.userId ?? "—"}</td>
      <td className="px-4 py-3 text-xs text-emerald-300">{log.action}</td>
      <td className="px-4 py-3 text-xs text-slate-400">{log.ipAddress ?? "—"}</td>
      <td className="px-4 py-3 text-xs text-slate-400">{log.userAgent ?? "—"}</td>
      <td className="px-4 py-3 text-xs text-slate-400 whitespace-pre-wrap">
        {formatMetadata(log.metadata)}
      </td>
      <td className="px-4 py-3 text-xs text-slate-500">{log.createdAt.toLocaleString()}</td>
    </tr>
  );
}

function formatMetadata(metadata: AuditLog["metadata"]): string {
  if (!metadata) return "—";
  try {
    return JSON.stringify(metadata, null, 2);
  } catch {
    return String(metadata);
  }
}
