"use client";

import { useState } from "react";
import { useArchive } from "../../hooks/useArchive";

export default function BackupStatus() {
  const { archives, loading, error, refetch } = useArchive();
  const [deleting, setDeleting] = useState(false);

  if (loading) {
    return <p className="mt-4 text-blue-400">⏳ جاري إنشاء نسخة احتياطية...</p>;
  }

  if (error) {
    return (
      <div className="mt-4 text-red-400">
        ❌ {error}
        <button onClick={refetch} className="ml-2 px-2 py-1 text-xs bg-red-600 text-white rounded">
          إعادة المحاولة
        </button>
      </div>
    );
  }

  if (!archives.length) {
    return (
      <p className="mt-4 text-slate-400 text-sm border border-slate-700 rounded-lg p-2">
        ⚠️ لا توجد نسخ احتياطية
      </p>
    );
  }

  const latestArchive = archives[0]; // آخر نسخة

  async function handleDelete() {
    const confirmed = window.confirm(
      `⚠️ هل أنت متأكد أنك تريد حذف النسخة (${latestArchive.filename})؟`,
    );
    if (!confirmed) return;

    try {
      setDeleting(true);
      const res = await fetch(`/api/backups/${latestArchive.filename}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "❌ فشل في حذف النسخة");
        return;
      }
      alert(`🗑️ ${latestArchive.filename} تم حذفها بنجاح`);
      refetch();
    } catch (err: any) {
      alert(err.message || "خطأ غير متوقع");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mt-4 text-sm text-slate-300 space-y-3">
      <p>
        ✅ آخر نسخة احتياطية: <span className="font-mono">{latestArchive.filename}</span>
      </p>

      <div className="flex flex-wrap gap-3">
        {/* ✅ Group Buttons */}
        <div className="flex w-full sm:w-auto rounded-lg overflow-hidden shadow-md">
          {/* Download */}
          <a
            href={deleting ? undefined : `/api/backups/${latestArchive.filename}`}
            download
            onClick={(e) => deleting && e.preventDefault()}
            className={`flex-1 text-center px-4 py-2 text-xs font-medium transition-colors ${
              deleting
                ? "bg-green-400 cursor-not-allowed text-white"
                : "bg-green-700 hover:bg-green-600 text-white"
            }`}
          >
            {deleting ? "⏳ معطل..." : "💾 تحميل النسخة"}
          </a>

          {/* Delete */}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className={`flex-1 text-center px-4 py-2 text-xs font-medium transition-colors ${
              deleting
                ? "bg-red-400 cursor-not-allowed text-white"
                : "bg-red-700 hover:bg-red-600 text-white"
            }`}
          >
            {deleting ? "⏳ جاري الحذف..." : "🗑️ حذف النسخة"}
          </button>
        </div>

        {latestArchive.report_url && (
          <a
            href={latestArchive.report_url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 rounded bg-blue-700 hover:bg-blue-600 text-white text-xs font-medium shadow-md"
          >
            📑 عرض التقرير
          </a>
        )}
      </div>
    </div>
  );
}
