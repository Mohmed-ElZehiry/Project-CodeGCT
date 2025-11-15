"use client";

import { useMemo, useState } from "react";
import { logError, logInfo } from "@/lib/utils/logger";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { RefreshButton } from "@/shared/components/ui/refresh-button";
import { useAdminUsersQuery, useUpdateAdminUserMutation } from "../hooks/adminUseUsers";
import type { AdminRole, AdminUser } from "../types/admin";

type AdminUsersTableProps = {
  onSelectUser?: (user: AdminUser) => void;
};

const ROLE_OPTIONS: AdminRole[] = ["user", "support", "admin"];
const STATUS_OPTIONS: AdminUser["status"][] = ["active", "suspended", "pending"];

export default function AdminUsersTable({ onSelectUser }: AdminUsersTableProps) {
  const { data, isLoading, isError, error, refetch, isFetching } = useAdminUsersQuery();
  const mutation = useUpdateAdminUserMutation({
    onSuccess: (updated) => {
      logInfo("admin.users: role/status updated", {
        userId: updated.id,
        role: updated.role,
        status: updated.status,
      });
      setEditingId(null);
    },
    onError: (mutationError, variables) => {
      logError("admin.users: failed to update user", {
        userId: variables.userId,
        error: mutationError.message,
      });
    },
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftRole, setDraftRole] = useState<AdminRole>("user");
  const [draftStatus, setDraftStatus] = useState<AdminUser["status"]>("active");

  const users = useMemo(() => data ?? [], [data]);

  if (isLoading) {
    return <p className="text-slate-400">⏳ جاري تحميل المستخدمين...</p>;
  }

  if (isError) {
    return (
      <div className="space-y-3 text-red-400">
        <p>❌ فشل تحميل المستخدمين: {error?.message ?? "خطأ غير معروف"}</p>
        <button
          type="button"
          className="rounded border border-red-500/40 px-3 py-1 text-sm hover:bg-red-500/10"
          onClick={() => refetch()}
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  if (!users.length) {
    return <p className="text-slate-400">لا يوجد مستخدمون حتى الآن.</p>;
  }

  const handleEdit = (user: AdminUser) => {
    setEditingId(user.id);
    setDraftRole(user.role);
    setDraftStatus(user.status);
    onSelectUser?.(user);
  };

  const handleSave = async (userId: string) => {
    try {
      await mutation.mutateAsync({ userId, payload: { role: draftRole, status: draftStatus } });
    } catch (err) {
      // تم تسجيل الخطأ في onError
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        {isFetching && <p className="text-xs text-slate-500">🔄 يتم تحديث البيانات...</p>}
        <RefreshButton
          onRefresh={async () => {
            await refetch();
          }}
          loading={isFetching}
        />
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
        <table className="min-w-full border-collapse text-sm text-slate-200">
          <thead className="bg-slate-900/70 text-left text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-3">المستخدم</th>
              <th className="px-4 py-3">البريد</th>
              <th className="px-4 py-3">الدور</th>
              <th className="px-4 py-3">الحالة</th>
              <th className="px-4 py-3">آخر تسجيل دخول</th>
              <th className="px-4 py-3 text-right">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {users.map((user) => {
              const isEditing = editingId === user.id;
              return (
                <tr key={user.id} className="hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-medium text-slate-100">{user.fullName ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-300">{user.email}</td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <select
                        value={draftRole}
                        onChange={(event) => setDraftRole(event.target.value as AdminRole)}
                        aria-label="تغيير دور المستخدم"
                        className="rounded-md border border-slate-700 bg-slate-900/70 px-2 py-1 text-sm"
                      >
                        {ROLE_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {translateRole(option)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="capitalize">{translateRole(user.role)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <select
                        value={draftStatus}
                        onChange={(event) =>
                          setDraftStatus(event.target.value as AdminUser["status"])
                        }
                        aria-label="تغيير حالة المستخدم"
                        className="rounded-md border border-slate-700 bg-slate-900/70 px-2 py-1 text-sm"
                      >
                        {STATUS_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {translateStatus(option)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <StatusBadge status={user.status} />
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {user.lastSignInAt ? new Date(user.lastSignInAt).toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isEditing ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          className="rounded border border-emerald-500/40 bg-emerald-500/20 px-3 py-1 text-xs text-emerald-100 hover:bg-emerald-500/30"
                          onClick={() => handleSave(user.id)}
                          disabled={mutation.isPending}
                        >
                          {mutation.isPending ? "جاري الحفظ..." : "حفظ"}
                        </button>
                        <button
                          type="button"
                          className="rounded border border-slate-600 px-3 py-1 text-xs text-slate-200 hover:bg-slate-800"
                          onClick={() => setEditingId(null)}
                          disabled={mutation.isPending}
                        >
                          إلغاء
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="rounded border border-slate-600 px-3 py-1 text-xs text-slate-200 hover:bg-slate-800"
                        onClick={() => handleEdit(user)}
                      >
                        تعديل
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function translateRole(role: AdminRole) {
  switch (role) {
    case "admin":
      return "مشرف";
    case "support":
      return "دعم";
    default:
      return "مستخدم";
  }
}

function translateStatus(status: AdminUser["status"]) {
  switch (status) {
    case "active":
      return "نشط";
    case "suspended":
      return "موقوف";
    case "pending":
      return "بانتظار التفعيل";
    default:
      return status;
  }
}
