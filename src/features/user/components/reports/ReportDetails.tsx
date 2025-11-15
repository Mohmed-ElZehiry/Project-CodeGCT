// src/features/user/components/reports/ReportDetails.tsx
"use client";

import React, { useMemo } from "react";
import { Pie, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";
import type { AnalysisReport, ReportOverview } from "../../types/user";
import { ReportActions } from "./ReportActions";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const PALETTE = [
  "#2563EB",
  "#F59E0B",
  "#10B981",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
  "#F97316",
];

function formatDate(value?: string) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function renderListOrEmpty(items?: string[] | null) {
  if (!items || items.length === 0) {
    return <p className="text-sm text-muted-foreground">لا توجد بيانات.</p>;
  }
  return (
    <ul className="list-disc list-inside text-sm space-y-1 marker:text-primary">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function formatNumber(value: number) {
  return Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(value);
}

interface ReportDetailsProps {
  report: AnalysisReport;
}

export const ReportDetails: React.FC<ReportDetailsProps> = ({ report }) => {
  const fileTree = useMemo(() => report.structure?.tree ?? [], [report.structure]);
  const overview: ReportOverview = useMemo(
    () =>
      report.overview ?? {
        language: null,
        frameworks: [],
        libraries: [],
      },
    [report.overview],
  );
  const dependencies = useMemo(() => report.dependencies?.list ?? [], [report.dependencies]);

  const extensionCounts = useMemo(() => {
    return fileTree.reduce<Record<string, number>>((acc, filePath) => {
      const match = filePath.match(/\.([^.\/]+)$/);
      const ext = match ? match[1].toLowerCase() : "غير معروف";
      acc[ext] = (acc[ext] ?? 0) + 1;
      return acc;
    }, {});
  }, [fileTree]);

  const fileTypePieData = useMemo(() => {
    const labels = Object.keys(extensionCounts);
    if (!labels.length) return null;
    const datasets = [
      {
        label: "ملفات",
        data: labels.map((label) => extensionCounts[label]),
        backgroundColor: labels.map((_, idx) => PALETTE[idx % PALETTE.length]),
        borderWidth: 0,
      },
    ];
    return { labels, datasets };
  }, [extensionCounts]);

  const dependencyTypeCounts = useMemo(() => {
    return dependencies.reduce<Record<string, number>>((acc, dep) => {
      acc[dep.type] = (acc[dep.type] ?? 0) + 1;
      return acc;
    }, {});
  }, [dependencies]);

  const dependencyBarData = useMemo(() => {
    const labels = Object.keys(dependencyTypeCounts).map((type) => type.toUpperCase());
    if (!labels.length) return null;
    return {
      labels,
      datasets: [
        {
          label: "عدد التبعيات",
          data: labels.map((label) => dependencyTypeCounts[label.toLowerCase()] ?? 0),
          backgroundColor: "#2563EB",
          borderRadius: 6,
        },
      ],
    };
  }, [dependencyTypeCounts]);

  const summaryCards = useMemo(
    () => [
      {
        label: "إجمالي الملفات",
        value: formatNumber(fileTree.length),
        hint: "عدد الملفات التي تم تحليلها",
      },
      {
        label: "اللغة الرئيسية",
        value: overview.language ?? "غير محدد",
        hint: "تم اكتشافها من الامتدادات والمحتوى",
      },
      {
        label: "الأطر",
        value: formatNumber(overview.frameworks?.length ?? 0),
        hint: overview.frameworks?.slice(0, 2).join(", ") || "لا يوجد",
      },
      {
        label: "إجمالي التبعيات",
        value: formatNumber(dependencies.length),
        hint: "يشمل تبعيات الإنتاج والتطوير",
      },
    ],
    [fileTree.length, overview.language, overview.frameworks, dependencies.length],
  );

  const hasContent = report.content !== undefined && report.content !== null;

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-slate-200/20 bg-slate-900/60 p-5 shadow-lg shadow-slate-900/20 backdrop-blur">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-100">{report.name}</h2>
            <p className="text-sm text-slate-400">معرّف التقرير: {report.id}</p>
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-300">
              <span className="rounded-full border border-blue-500/40 bg-blue-500/10 px-3 py-1 capitalize">
                الحالة: {report.status}
              </span>
              <span className="rounded-full border border-purple-500/40 bg-purple-500/10 px-3 py-1 uppercase">
                {report.format}
              </span>
              <span className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1">
                إنشاء: {formatDate(report.createdAt)}
              </span>
              <span className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1">
                تحديث: {formatDate(report.updatedAt)}
              </span>
            </div>
          </div>
          <ReportActions reportId={report.id} />
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-inner shadow-slate-950/20 backdrop-blur transition hover:border-blue-500/40"
          >
            <p className="text-sm text-slate-400">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-100">{card.value}</p>
            <p className="mt-1 text-xs text-slate-500">{card.hint}</p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg shadow-slate-900/20 backdrop-blur">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-100">توزيع أنواع الملفات</h3>
            <span className="text-xs text-slate-400">حسب الامتداد</span>
          </div>
          {fileTypePieData ? (
            <Pie data={fileTypePieData} options={{ plugins: { legend: { position: "bottom" } } }} />
          ) : (
            <p className="text-sm text-muted-foreground">لا توجد بيانات لعرضها.</p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg shadow-slate-900/20 backdrop-blur">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-100">تصنيف التبعيات</h3>
            <span className="text-xs text-slate-400">إنتاج / تطوير / غير محدد</span>
          </div>
          {dependencyBarData ? (
            <Bar
              data={dependencyBarData}
              options={{
                plugins: { legend: { display: false } },
                scales: {
                  x: { ticks: { color: "#94A3B8" }, grid: { display: false } },
                  y: {
                    ticks: { color: "#94A3B8" },
                    beginAtZero: true,
                    grid: { color: "rgba(148,163,184,0.1)" },
                  },
                },
              }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">لم يتم العثور على تبعيات.</p>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg shadow-slate-900/20 backdrop-blur xl:col-span-2">
          <h3 className="text-lg font-semibold text-slate-100">نظرة عامة تقنية</h3>
          <div className="mt-3 grid gap-6 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-slate-300">الأطر المكتشفة</p>
              {renderListOrEmpty(overview.frameworks)}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-300">المكتبات أو التقنيات</p>
              {renderListOrEmpty(overview.libraries)}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg shadow-slate-900/20 backdrop-blur">
          <h3 className="text-lg font-semibold text-slate-100">تنبيهات سريعة</h3>
          <div className="mt-3 space-y-2 text-sm">
            {(report.insights?.warnings?.length ?? 0) > 0 ? (
              report.insights!.warnings!.map((warning, idx) => (
                <div
                  key={`warning-${idx}`}
                  className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-red-200"
                >
                  ⚠️ {warning}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">لا توجد تحذيرات حرجة.</p>
            )}

            {(report.insights?.recommendations?.length ?? 0) > 0 && (
              <div className="pt-3">
                <p className="text-xs uppercase tracking-wide text-slate-400">توصيات</p>
                <ul className="mt-2 space-y-2 text-sm text-slate-200">
                  {report.insights!.recommendations!.map((rec, idx) => (
                    <li
                      key={`rec-${idx}`}
                      className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2"
                    >
                      ✅ {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg shadow-slate-900/20 backdrop-blur">
        <h3 className="text-lg font-semibold text-slate-100">هيكل المشروع</h3>
        {report.structure?.description && (
          <p className="mt-2 text-sm text-slate-400">{report.structure.description}</p>
        )}
        {fileTree.length ? (
          <div className="mt-4 max-h-72 overflow-auto rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-300">
            {fileTree.map((line) => (
              <div key={line} className="font-mono">
                {line}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">لم يتم العثور على ملفات في الهيكل.</p>
        )}
      </section>

      {dependencies.length > 0 && (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg shadow-slate-900/20 backdrop-blur">
          <h3 className="text-lg font-semibold text-slate-100">تفاصيل التبعيات</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800 text-sm text-slate-200">
              <thead className="bg-slate-900/80">
                <tr>
                  <th className="px-4 py-2 text-left font-medium uppercase tracking-wide text-slate-400">
                    الاسم
                  </th>
                  <th className="px-4 py-2 text-left font-medium uppercase tracking-wide text-slate-400">
                    الإصدار
                  </th>
                  <th className="px-4 py-2 text-left font-medium uppercase tracking-wide text-slate-400">
                    النوع
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {dependencies.map((dep) => (
                  <tr key={`${dep.name}-${dep.type}`} className="hover:bg-slate-900/70">
                    <td className="px-4 py-2 font-medium text-slate-100">{dep.name}</td>
                    <td className="px-4 py-2 text-slate-300">{dep.version}</td>
                    <td className="px-4 py-2 capitalize text-blue-300">{dep.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {hasContent && (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg shadow-slate-900/20 backdrop-blur">
          <details>
            <summary className="cursor-pointer text-sm font-semibold text-blue-300">
              عرض JSON الكامل
            </summary>
            <pre className="mt-3 max-h-80 overflow-auto rounded-lg bg-slate-950/80 p-4 text-xs text-slate-200">
              {JSON.stringify(report.content, null, 2)}
            </pre>
          </details>
        </section>
      )}
    </div>
  );
};
