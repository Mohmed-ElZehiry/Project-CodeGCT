"use client";

import { useMemo, useState } from "react";
import { logError, logInfo } from "@/lib/utils/logger";
import {
  useAdminSystemSettingsQuery,
  useUpdateAdminSystemSettingMutation,
} from "../hooks/adminUseSettings";
import type { AdminSystemSetting } from "../types/admin";

type EditingState = {
  key: string;
  value: string;
};

export default function AdminSystemSettings() {
  const { data, isLoading, isError, error, refetch, isFetching } = useAdminSystemSettingsQuery();
  const mutation = useUpdateAdminSystemSettingMutation({
    onSuccess: (setting) => {
      logInfo("admin.settings: setting updated", { key: setting.key });
      setEditing(null);
    },
    onError: (mutationError, variables) => {
      logError("admin.settings: failed to update", {
        key: variables.key,
        error: mutationError.message,
      });
    },
  });

  const [editing, setEditing] = useState<EditingState | null>(null);

  const settings = useMemo(() => data ?? [], [data]);

  if (isLoading) {
    return <p className="text-slate-400">⏳ جاري تحميل الإعدادات...</p>;
  }

  if (isError) {
    return (
      <div className="space-y-3 text-red-400">
        <p>❌ تعذّر تحميل الإعدادات: {error?.message ?? "خطأ غير معروف"}</p>
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

  if (!settings.length) {
    return <p className="text-slate-400">لا توجد إعدادات معرّفة.</p>;
  }

  const handleEdit = (setting: AdminSystemSetting) => {
    setEditing({ key: setting.key, value: String(setting.value ?? "") });
  };

  const handleCancel = () => setEditing(null);

  const handleSave = async () => {
    if (!editing) return;
    try {
      await mutation.mutateAsync({ key: editing.key, value: parseValue(editing.value) });
    } catch (err) {
      // already logged via onError
    }
  };

  return (
    <div className="space-y-4">
      {isFetching && <p className="text-xs text-slate-500">🔄 يتم تحديث البيانات...</p>}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
        <table className="min-w-full border-collapse text-sm text-slate-200">
          <thead className="bg-slate-900/70 text-left text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-3">المفتاح</th>
              <th className="px-4 py-3">القيمة</th>
              <th className="px-4 py-3">الفئة</th>
              <th className="px-4 py-3">قابل للتعديل</th>
              <th className="px-4 py-3">آخر تحديث</th>
              <th className="px-4 py-3 text-right">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {settings.map((setting) => {
              const isEditing = editing?.key === setting.key;
              return (
                <tr key={setting.key} className="hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-medium text-slate-100">{setting.key}</td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <textarea
                        value={editing?.value ?? ""}
                        onChange={(event) =>
                          setEditing((prev) =>
                            prev ? { ...prev, value: event.target.value } : prev,
                          )
                        }
                        rows={2}
                        aria-label={`تحديث قيمة ${setting.key}`}
                        className="w-full rounded-md border border-slate-700 bg-slate-900/70 px-2 py-1 text-sm"
                      />
                    ) : (
                      <span className="whitespace-pre-wrap text-slate-200">
                        {renderValue(setting.value)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">{setting.category}</td>
                  <td className="px-4 py-3 text-xs">
                    {setting.editable ? (
                      <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-emerald-200">
                        نعم
                      </span>
                    ) : (
                      <span className="rounded-full border border-slate-600 bg-slate-800 px-2 py-0.5 text-slate-300">
                        لا
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {setting.updatedAt ? new Date(setting.updatedAt).toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {setting.editable ? (
                      isEditing ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            className="rounded border border-emerald-500/40 bg-emerald-500/20 px-3 py-1 text-xs text-emerald-100 hover:bg-emerald-500/30"
                            onClick={handleSave}
                            disabled={mutation.isPending}
                          >
                            {mutation.isPending ? "جاري الحفظ..." : "حفظ"}
                          </button>
                          <button
                            type="button"
                            className="rounded border border-slate-600 px-3 py-1 text-xs text-slate-200 hover:bg-slate-800"
                            onClick={handleCancel}
                            disabled={mutation.isPending}
                          >
                            إلغاء
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="rounded border border-slate-600 px-3 py-1 text-xs text-slate-200 hover:bg-slate-800"
                          onClick={() => handleEdit(setting)}
                        >
                          تعديل
                        </button>
                      )
                    ) : (
                      <span className="text-xs text-slate-500">غير قابل للتعديل</span>
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

function renderValue(value: unknown): string {
  if (value === null || typeof value === "undefined") return "—";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

function parseValue(raw: string): unknown {
  const trimmed = raw.trim();
  if (trimmed === "") return "";
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (!Number.isNaN(Number(trimmed)) && trimmed === String(Number(trimmed))) {
    return Number(trimmed);
  }
  try {
    return JSON.parse(trimmed);
  } catch {
    return raw;
  }
}
