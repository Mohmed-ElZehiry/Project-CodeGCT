"use client";

import { useMemo } from "react";
import type { SupportReport } from "../types/support";
import { useSupportReportsQuery } from "../hooks/queries/supportReportsQueries";

type SupportReportsTableProps = {
  selectedId?: string | null;
  onSelect?: (report: SupportReport) => void;
};

export default function SupportReportsTable({ selectedId, onSelect }: SupportReportsTableProps) {
  const { data, isLoading, isError, error, refetch } = useSupportReportsQuery();

  const reports = useMemo(() => data ?? [], [data]);

  const rows = useMemo(() => {
    return reports.map((report) => ({
      ...report,
      createdLabel: new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(report.createdAt),
    }));
  }, [reports]);

  if (isLoading) {
    return <p className="text-slate-400">⏳ Loading support reports...</p>;
  }

  if (isError) {
    return (
      <div className="space-y-2 text-red-400">
        <p>❌ Failed to load support reports: {error?.message ?? "Unknown error"}</p>
        <button
          type="button"
          className="rounded border border-red-500/40 px-3 py-1 text-sm text-red-200 hover:bg-red-500/10"
          onClick={() => refetch()}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!reports.length) {
    return <p className="text-slate-400">لا توجد بلاغات حتى الآن.</p>;
  }

  return (
    <div className="overflow-hidden rounded border border-slate-800 bg-slate-900/40">
      <table className="w-full border-collapse">
        <thead className="bg-slate-900/70 text-left text-xs uppercase tracking-wide text-slate-400">
          <tr>
            <th className="px-4 py-3">العنوان</th>
            <th className="px-4 py-3">الأولوية</th>
            <th className="px-4 py-3">الحالة</th>
            <th className="px-4 py-3">تاريخ الإنشاء</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800 text-sm text-slate-200">
          {rows.map((report) => {
            const isActive = report.id === selectedId;
            return (
              <tr
                key={report.id}
                className={`cursor-pointer transition hover:bg-slate-800/60 ${
                  isActive ? "bg-blue-500/10" : ""
                }`}
                onClick={() => onSelect?.(report)}
              >
                <td className="px-4 py-3 font-medium text-slate-100">{report.title}</td>
                <td className="px-4 py-3 capitalize text-slate-300">{report.priority}</td>
                <td className="px-4 py-3 capitalize">
                  <span className="inline-flex items-center rounded-full border border-slate-700 px-2 py-0.5 text-xs text-slate-200">
                    {report.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400">{report.createdLabel}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
