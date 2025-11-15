"use client";

import { useMemo } from "react";
import { useSupportReportsQuery } from "../hooks/queries/supportReportsQueries";

export default function SupportStats() {
  const { data, isLoading, isError, error } = useSupportReportsQuery();

  const stats = useMemo(() => {
    const reports = data ?? [];
    const total = reports.length;
    const open = reports.filter((report) => report.status === "open").length;
    const inProgress = reports.filter((report) => report.status === "in_progress").length;
    const resolved = reports.filter(
      (report) => report.status === "resolved" || report.status === "closed",
    ).length;

    return {
      total,
      open,
      inProgress,
      resolved,
    };
  }, [data]);

  if (isLoading) {
    return <p className="text-slate-400">⏳ تحميل إحصائيات الدعم...</p>;
  }

  if (isError) {
    return (
      <p className="text-red-500">❌ تعذر تحميل الإحصائيات: {error?.message ?? "خطأ غير معروف"}</p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <StatCard label="إجمالي البلاغات" value={stats.total} accent="text-blue-300" />
      <StatCard label="مفتوحة" value={stats.open} accent="text-amber-300" />
      <StatCard label="قيد المعالجة" value={stats.inProgress} accent="text-purple-300" />
      <StatCard label="محلولة / مغلقة" value={stats.resolved} accent="text-emerald-300" />
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 shadow-sm shadow-slate-900/10">
      <p className="text-sm text-slate-400">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${accent}`}>{value}</p>
    </div>
  );
}
