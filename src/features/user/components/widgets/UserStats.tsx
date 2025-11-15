"use client";

import React from "react";
import { useAuth } from "@/shared/hooks/useAuth";
import { useUploads } from "@/features/user/hooks/useUploads";

export default function UserStats() {
  const { userId } = useAuth();
  const { uploads, loading } = useUploads(userId || "");

  if (!userId) return <div>يجب تسجيل الدخول أولاً</div>;
  if (loading) return <div>⏳ جاري تحميل الإحصائيات...</div>;

  const totalUploads = uploads.length;
  const pending = uploads.filter((u) => u.status === "pending").length;
  const completed = uploads.filter(
    (u) => u.status === "ready" || u.status === "compared" || u.status === "documented",
  ).length;

  return (
    <div className="grid grid-cols-3 gap-4 text-center">
      <div className="card p-4">
        <h3 className="text-lg font-semibold">📂 إجمالي الملفات</h3>
        <p className="text-2xl font-bold">{totalUploads}</p>
      </div>
      <div className="card p-4">
        <h3 className="text-lg font-semibold">⏳ قيد المعالجة</h3>
        <p className="text-2xl font-bold">{pending}</p>
      </div>
      <div className="card p-4">
        <h3 className="text-lg font-semibold">✅ مكتملة</h3>
        <p className="text-2xl font-bold">{completed}</p>
      </div>
    </div>
  );
}
