"use client";

import React from "react";
import EmptyState from "../widgets/EmptyState";
import { useComparisons } from "@/features/user/hooks/useComparisons";

export default function ComparisonList() {
  const { comparisons, loading, error } = useComparisons();

  if (loading) return <EmptyState message="⏳ جاري تحميل المقارنات..." />;
  if (error) return <EmptyState message={`❌ ${error}`} />;
  if (!comparisons.length) return <EmptyState message="لا توجد مقارنات بعد" />;

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/50 shadow-inner">
      <h2 className="text-lg font-bold text-blue-400 p-4 border-b border-slate-700">
        📋 المقارنات السابقة
      </h2>
      <ul className="divide-y divide-slate-700/50">
        {comparisons.map((c) => {
          const createdAt = c.createdAt ?? null;
          const status = c.status ?? "pending";
          const createdLabel = createdAt
            ? new Date(createdAt).toLocaleString("ar-EG")
            : "غير معروف";

          return (
            <li
              key={c.id}
              className="p-4 flex justify-between items-center hover:bg-slate-800/40 transition"
            >
              <div>
                <p className="text-slate-200 text-sm">
                  {c.upload1Id} 🔀 {c.upload2Id}
                </p>
                <p className="text-slate-500 text-xs">{createdLabel}</p>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded ${
                  status === "completed"
                    ? "bg-green-700 text-green-200"
                    : status === "failed"
                      ? "bg-red-700 text-red-200"
                      : "bg-yellow-700 text-yellow-200"
                }`}
              >
                {status === "completed" ? "ناجحة" : status === "failed" ? "فشلت" : "قيد التنفيذ"}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
