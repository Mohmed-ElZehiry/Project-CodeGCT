"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useReports } from "@/features/user/hooks/reports/useReports";
import { useComparisons } from "@/features/user/hooks/useComparisons";
import type { AnalysisReport, ComparisonDoc, ComparisonStatus } from "@/features/user/types/user";
import { useNotification } from "@/features/user/context/NotificationContext";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import {
  CalendarClock,
  FileText,
  FolderGit2,
  GitCompare,
  RefreshCcw,
  Download,
  Trash2,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Clock3,
  FileDiff,
  PlusCircle,
  MinusCircle,
  Fingerprint,
  Copy,
} from "lucide-react";
import { useRouter } from "next/navigation";

type ProjectSummary = {
  id: string;
  name: string;
  description?: string | null;
  code?: string | null;
};

const NO_PROJECT_VALUE = "__NO_PROJECT__";

const BYTE_UNITS = ["بايت", "ك.ب", "م.ب", "ج.ب", "ت.ب"] as const;

const formatByteSize = (bytes?: number | null): string => {
  if (bytes === undefined || bytes === null || Number.isNaN(bytes)) return "—";

  const absolute = Math.abs(bytes);
  let value = absolute;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < BYTE_UNITS.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const formatted =
    unitIndex === 0 || value >= 10 ? Math.round(value).toString() : value.toFixed(1);
  const sign = bytes < 0 ? "-" : "";
  return `${sign}${formatted} ${BYTE_UNITS[unitIndex]}`;
};

const comparisonStatusToLabel = (status?: ComparisonStatus): string => {
  switch (status) {
    case "completed":
      return "مكتملة";
    case "failed":
      return "فشلت";
    case "processing":
      return "قيد التنفيذ";
    case "pending":
      return "بانتظار التنفيذ";
    default:
      return "غير معروف";
  }
};

const comparisonStatusToBadgeClass = (status?: ComparisonStatus): string => {
  switch (status) {
    case "completed":
      return "border-emerald-500/40 text-emerald-200";
    case "failed":
      return "border-rose-500/40 text-rose-200";
    case "processing":
    case "pending":
      return "border-amber-500/40 text-amber-200";
    default:
      return "border-slate-500/40 text-slate-200";
  }
};

const isStructuredResult = (value: unknown): value is Record<string, any> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export default function ReportsPage() {
  const router = useRouter();
  const {
    reports,
    loading: reportsLoading,
    error: reportsError,
    deleteReport,
    exportReport,
    lastFetchedAt: reportsLastFetchedAt,
    refetch: refetchReports,
  } = useReports();
  const {
    comparisons,
    loading: comparisonsLoading,
    error: comparisonsError,
    lastFetchedAt: comparisonsLastFetchedAt,
    refetch: refetchComparisons,
  } = useComparisons();
  const { notifyError, notifySuccess } = useNotification();

  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string | undefined>(undefined);
  const [selectedReportId, setSelectedReportId] = useState<string>("");
  const [exporting, setExporting] = useState(false);
  const [removing, setRemoving] = useState(false);

  const locale = useMemo(
    () => (typeof window !== "undefined" ? window.location.pathname.split("/")[1] || "en" : "en"),
    [],
  );

  const hasUnassignedReports = useMemo(() => reports.some((item) => !item.projectId), [reports]);

  const analysisSummary = useMemo(() => {
    const completedStatuses = new Set(["ready", "compared", "documented"]);
    const inProgressStatuses = new Set(["pending", "analyzing"]);

    let completed = 0;
    let failed = 0;
    let inProgress = 0;

    reports.forEach((report) => {
      if (!report.status) return;
      if (completedStatuses.has(report.status)) {
        completed += 1;
      } else if (report.status === "failed") {
        failed += 1;
      } else if (inProgressStatuses.has(report.status)) {
        inProgress += 1;
      }
    });

    return {
      total: reports.length,
      completed,
      failed,
      inProgress,
    };
  }, [reports]);

  const comparisonSummary = useMemo(() => {
    let completed = 0;
    let failed = 0;
    let inProgress = 0;

    comparisons.forEach((comparison) => {
      if (comparison.status === "completed") {
        completed += 1;
      } else if (comparison.status === "failed") {
        failed += 1;
      } else {
        inProgress += 1;
      }
    });

    return {
      total: comparisons.length,
      completed,
      failed,
      inProgress,
    };
  }, [comparisons]);

  const sortedComparisons = useMemo(
    () =>
      [...comparisons].sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      }),
    [comparisons],
  );

  const selectedProjectId = useMemo(() => {
    if (!selectedFilter) return undefined;
    return selectedFilter === NO_PROJECT_VALUE ? null : selectedFilter;
  }, [selectedFilter]);

  const filteredReports = useMemo(() => {
    if (selectedFilter === undefined) return [];
    const target = selectedFilter === NO_PROJECT_VALUE ? null : selectedFilter;
    return reports.filter((report) =>
      target === null ? report.projectId === null : report.projectId === target,
    );
  }, [reports, selectedFilter]);

  const selectedReport = useMemo<AnalysisReport | null>(
    () => filteredReports.find((report) => report.id === selectedReportId) ?? null,
    [filteredReports, selectedReportId],
  );

  const selectedProjectLabel = useMemo(() => {
    if (selectedProjectId === undefined) return null;
    if (selectedProjectId === null) return "بدون مشروع";
    const match = projects.find((project) => project.id === selectedProjectId);
    return match ? match.name : selectedProjectId;
  }, [projects, selectedProjectId]);

  const loadProjects = useCallback(async () => {
    setProjectsLoading(true);
    setProjectsError(null);
    try {
      const res = await fetch(`/${locale}/api/user/projects`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "تعذر تحميل قائمة المشاريع");
      }
      const list: ProjectSummary[] = Array.isArray(json.data)
        ? json.data.map((item: any) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            code: item.code,
          }))
        : [];
      setProjects(list);
    } catch (err: any) {
      const message = err?.message || "حدث خطأ أثناء تحميل المشاريع";
      setProjectsError(message);
      setProjects([]);
    } finally {
      setProjectsLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (reportsError) {
      notifyError("فشل تحميل تقارير التحليل", String(reportsError));
    }
  }, [reportsError, notifyError]);

  useEffect(() => {
    if (comparisonsError) {
      notifyError("فشل تحميل تقارير المقارنة", String(comparisonsError));
    }
  }, [comparisonsError, notifyError]);

  useEffect(() => {
    if (selectedFilter === undefined && !projectsLoading) {
      if (projects.length === 1) {
        setSelectedFilter(projects[0].id);
        setSelectedReportId("");
      } else if (!projects.length && hasUnassignedReports) {
        setSelectedFilter(NO_PROJECT_VALUE);
        setSelectedReportId("");
      }
    }
  }, [projects, projectsLoading, hasUnassignedReports, selectedFilter]);

  useEffect(() => {
    if (filteredReports.length && !filteredReports.some((r) => r.id === selectedReportId)) {
      setSelectedReportId(filteredReports[0].id);
    }
  }, [filteredReports, selectedReportId]);

  const handleExport = async (reportId: string) => {
    setExporting(true);
    try {
      const blob = await exportReport(reportId, "json");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${reportId}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      notifySuccess("✅ تم تصدير التقرير بصيغة JSON", undefined, 4000);
    } catch (err: any) {
      notifyError("❌ فشل تصدير التقرير", err?.message || "يرجى المحاولة مرة أخرى");
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async (reportId: string) => {
    if (!confirm("هل أنت متأكد من حذف التقرير؟")) return;
    setRemoving(true);
    try {
      await deleteReport(reportId);
      notifySuccess("🗑️ تم حذف التقرير بنجاح", undefined, 4000);
      setSelectedReportId((prev) => (prev === reportId ? "" : prev));
      await refetchReports();
    } catch (err: any) {
      notifyError("❌ فشل حذف التقرير", err?.message || "يرجى المحاولة مرة أخرى");
    } finally {
      setRemoving(false);
    }
  };

  const renderReportCard = (report: AnalysisReport) => {
    const isActive = report.id === selectedReportId;
    return (
      <button
        key={report.id}
        type="button"
        onClick={() => setSelectedReportId(report.id)}
        className={`w-full text-start rounded-lg border p-4 shadow-sm transition hover:border-primary hover:shadow-md ${
          isActive ? "border-primary bg-primary/5" : "border-muted bg-card"
        }`}
      >
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-sm">
            {report.name ?? `Report-${report.id.slice(0, 6)}`}
          </span>
          <span className="text-xs text-muted-foreground">
            بتاريخ {new Date(report.createdAt).toLocaleString()}
          </span>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <Badge variant="outline">الحالة: {report.status}</Badge>
            <Badge variant="outline">الصيغة: {report.format}</Badge>
            {report.projectId && <Badge variant="secondary">المشروع: {report.projectId}</Badge>}
          </div>
        </div>
      </button>
    );
  };

  const renderReportDetails = (report: AnalysisReport) => {
    const fileCount = report.structure?.tree?.length ?? 0;
    const frameworks = report.overview?.frameworks ?? [];
    const libraries = report.overview?.libraries ?? [];
    const warningsCount = report.insights?.warnings?.length ?? 0;
    const recommendationsCount = report.insights?.recommendations?.length ?? 0;

    const summaryHighlights = [
      {
        label: "عدد الملفات",
        value: fileCount.toString(),
        hint: "إجمالي الملفات التي شملها التحليل",
      },
      {
        label: "الأطر المكتشفة",
        value: frameworks.length ? frameworks.length.toString() : "—",
        hint: frameworks.slice(0, 3).join("، ") || "لا توجد أطر معروفة",
      },
      {
        label: "المكتبات",
        value: libraries.length ? libraries.length.toString() : "—",
        hint: libraries.slice(0, 3).join("، ") || "لم تُكتشف مكتبات",
      },
      {
        label: "تنبيهات وتحسينات",
        value: `${warningsCount}/${recommendationsCount}`,
        hint: "تحذيرات / توصيات",
      },
    ];

    return (
      <Card className="bg-slate-950/70 border border-slate-800 shadow-lg shadow-slate-950/30 backdrop-blur">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-400" />
              تفاصيل التقرير
            </CardTitle>
            <Badge
              variant="outline"
              className="border-blue-400/40 bg-blue-400/10 text-blue-100 capitalize"
            >
              الحالة: {report.status}
            </Badge>
          </div>
          <p className="text-xs text-slate-400">
            معرّف التقرير: <span className="font-mono text-slate-200">{report.id}</span>
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 flex flex-col gap-1">
              <p className="text-xs text-slate-400">العنوان</p>
              <p className="text-sm font-medium text-slate-100">{report.name ?? "—"}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 flex flex-col gap-1">
              <p className="text-xs text-slate-400">المشروع</p>
              <p className="text-sm font-medium text-slate-100 flex items-center gap-2">
                <FolderGit2 className="h-4 w-4 text-emerald-400" />
                {selectedProjectLabel ?? report.projectId ?? "—"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 flex flex-col gap-1">
              <p className="text-xs text-slate-400">الإصدار المرتبط</p>
              <p className="text-sm font-medium text-slate-100 flex items-center gap-2">
                <GitCompare className="h-4 w-4 text-indigo-400" />
                {report.uploadId ?? "—"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 flex flex-col gap-1">
              <p className="text-xs text-slate-400">صيغة التقرير</p>
              <p className="text-sm font-medium text-slate-100 uppercase flex items-center gap-2">
                <RefreshCcw className="h-4 w-4 text-amber-400" />
                {report.format}
              </p>
            </div>
          </section>

          <div className="h-px w-full bg-slate-800/60" role="presentation" />

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {summaryHighlights.map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 shadow-inner shadow-slate-950/20"
              >
                <p className="text-xs text-slate-400">{item.label}</p>
                <p className="mt-2 text-xl font-semibold text-slate-100">{item.value}</p>
                <p className="mt-1 text-xs text-slate-500">{item.hint}</p>
              </div>
            ))}
          </section>

          <div className="h-px w-full bg-slate-800/60" role="presentation" />

          <section className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <CalendarClock className="h-5 w-5 text-rose-400" />
              <div>
                <p className="text-xs text-slate-400">تاريخ الإنشاء</p>
                <p className="text-sm font-medium text-slate-100">
                  {new Date(report.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <CalendarClock className="h-5 و-5 text-purple-400" />
              <div>
                <p className="text-xs text-slate-400">آخر تحديث</p>
                <p className="text-sm font-medium text-slate-100">
                  {report.updatedAt ? new Date(report.updatedAt).toLocaleString() : "—"}
                </p>
              </div>
            </div>
          </section>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => router.push(`/${locale}/user/dashboard/reports/${report.id}`)}
            >
              <Eye className="h-4 w-4" />
              عرض التفاصيل الكاملة
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleExport(report.id)}
              disabled={exporting}
              className="flex items-center gap-2"
            >
              {exporting ? (
                <>
                  <RefreshCcw className="h-4 w-4 animate-spin" />
                  جاري التصدير...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  تصدير JSON
                </>
              )}
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleDelete(report.id)}
              disabled={removing}
              className="flex items-center gap-2"
            >
              {removing ? (
                <>
                  <RefreshCcw className="h-4 w-4 animate-spin" />
                  جاري الحذف...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  حذف التقرير
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const hasReportsData = reports.length > 0;
  const filteredCount = filteredReports.length;
  const hasComparisonsData = comparisons.length > 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">📑 التقارير</h1>
        <p className="text-sm text-muted-foreground">
          راجع التحليلات والمقارنات السابقة، واطّلع على ملخص الحالة لكل نوع.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border border-emerald-900/50 bg-emerald-950/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-200">
              <FileText className="h-5 w-5" /> تقارير التحليل
            </CardTitle>
            {reportsLastFetchedAt && (
              <p className="text-xs text-emerald-300/80">
                آخر تحديث: {reportsLastFetchedAt.toLocaleString()}
              </p>
            )}
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="flex items-center justify-between rounded-lg border border-emerald-800/40 bg-emerald-900/40 px-4 py-3">
              <div className="space-y-1">
                <p className="text-xs text-emerald-200/80">إجمالي التقارير</p>
                <p className="text-xl font-semibold text-emerald-100">{analysisSummary.total}</p>
              </div>
              <Badge variant="outline" className="border-emerald-500/40 text-emerald-200">
                {reportsLoading ? "جاري التحديث" : "جاهزة"}
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg border border-emerald-800/40 bg-emerald-900/30 p-3">
                <div className="flex items-center gap-2 text-emerald-200">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-xs">مكتملة</span>
                </div>
                <p className="mt-2 text-lg font-semibold text-emerald-100">
                  {analysisSummary.completed}
                </p>
              </div>
              <div className="rounded-lg border border-amber-800/40 bg-amber-900/20 p-3">
                <div className="flex items-center gap-2 text-amber-200">
                  <Clock3 className="h-4 w-4" />
                  <span className="text-xs">قيد التنفيذ</span>
                </div>
                <p className="mt-2 text-lg font-semibold text-amber-100">
                  {analysisSummary.inProgress}
                </p>
              </div>
              <div className="rounded-lg border border-rose-800/40 bg-rose-900/20 p-3">
                <div className="flex items-center gap-2 text-rose-200">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-xs">فشلت</span>
                </div>
                <p className="mt-2 text-lg font-semibold text-rose-100">{analysisSummary.failed}</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="mt-1 w-full border-emerald-700/60 text-emerald-100 hover:bg-emerald-900/40"
              onClick={() => refetchReports()}
              disabled={reportsLoading}
            >
              {reportsLoading ? "جاري التحديث..." : "تحديث تقارير التحليل"}
            </Button>
          </CardContent>
        </Card>

        <Card className="border border-indigo-900/50 bg-indigo-950/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-indigo-200">
              <GitCompare className="h-5 w-5" /> تقارير المقارنة
            </CardTitle>
            {comparisonsLastFetchedAt && (
              <p className="text-xs text-indigo-300/80">
                آخر تحديث: {comparisonsLastFetchedAt.toLocaleString()}
              </p>
            )}
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="flex items-center justify-between rounded-lg border border-indigo-800/40 bg-indigo-900/40 px-4 py-3">
              <div className="space-y-1">
                <p className="text-xs text-indigo-200/80">إجمالي المقارنات</p>
                <p className="text-xl font-semibold text-indigo-100">{comparisonSummary.total}</p>
              </div>
              <Badge variant="outline" className="border-indigo-500/40 text-indigo-200">
                {comparisonsLoading ? "جاري التحديث" : "جاهزة"}
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg border border-emerald-800/40 bg-emerald-900/20 p-3">
                <div className="flex items-center gap-2 text-emerald-200">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-xs">مكتملة</span>
                </div>
                <p className="mt-2 text-lg font-semibold text-emerald-100">
                  {comparisonSummary.completed}
                </p>
              </div>
              <div className="rounded-lg border border-amber-800/40 bg-amber-900/20 p-3">
                <div className="flex items-center gap-2 text-amber-200">
                  <Clock3 className="h-4 w-4" />
                  <span className="text-xs">قيد التنفيذ</span>
                </div>
                <p className="mt-2 text-lg font-semibold text-amber-100">
                  {comparisonSummary.inProgress}
                </p>
              </div>
              <div className="rounded-lg border border-rose-800/40 bg-rose-900/20 p-3">
                <div className="flex items-center gap-2 text-rose-200">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-xs">فشلت</span>
                </div>
                <p className="mt-2 text-lg font-semibold text-rose-100">
                  {comparisonSummary.failed}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="mt-1 w-full border-indigo-700/60 text-indigo-100 hover:bg-indigo-900/40"
              onClick={() => refetchComparisons()}
              disabled={comparisonsLoading}
            >
              {comparisonsLoading ? "جاري التحديث..." : "تحديث تقارير المقارنة"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">تقارير التحليل التفصيلية</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {reportsLoading ? (
            <p className="text-sm text-muted-foreground">⏳ جاري تحميل التقارير...</p>
          ) : !hasReportsData ? (
            <p className="text-sm text-muted-foreground">⚠️ لا توجد تقارير تحليل متاحة حالياً.</p>
          ) : selectedFilter === undefined ? (
            <p className="text-sm text-muted-foreground">اختر مشروعًا لعرض التقارير الخاصة به.</p>
          ) : filteredReports.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              ⚠️ لا توجد تقارير لهذا المشروع حتى الآن.
            </p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-6">
              <div className="space-y-3">
                <h2 className="text-sm font-medium text-muted-foreground">التقارير المحفوظة</h2>
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {filteredReports.map(renderReportCard)}
                </div>
              </div>

              <div>
                {selectedReport ? (
                  renderReportDetails(selectedReport)
                ) : (
                  <p className="text-sm text-muted-foreground">
                    اختر تقريرًا من القائمة لعرض تفاصيله.
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">أحدث تقارير المقارنة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {comparisonsLoading ? (
            <p className="text-sm text-muted-foreground">⏳ جاري تحميل تقارير المقارنة...</p>
          ) : !hasComparisonsData ? (
            <p className="text-sm text-muted-foreground">⚠️ لا توجد تقارير مقارنة متاحة حالياً.</p>
          ) : (
            <div className="space-y-3">
              {sortedComparisons.slice(0, 6).map((comparison) => {
                const structuredResult = isStructuredResult(comparison.result)
                  ? comparison.result
                  : null;
                const overview = structuredResult?.overview ?? structuredResult?.result?.overview;
                const filesSummary =
                  structuredResult?.filesSummary ?? structuredResult?.result?.filesSummary;
                const changes = structuredResult?.changes ?? structuredResult?.result?.changes;

                const statusBadge = (
                  <Badge
                    variant="outline"
                    className={comparisonStatusToBadgeClass(comparison.status)}
                  >
                    {comparisonStatusToLabel(comparison.status)}
                  </Badge>
                );

                return (
                  <div
                    key={comparison.id}
                    className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-4 shadow-inner shadow-slate-950/20"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-1 text-sm">
                        <p className="font-medium text-slate-100 flex flex-wrap items-center gap-2">
                          <GitCompare className="h-4 w-4 text-indigo-300" />
                          <span className="font-semibold text-indigo-200">
                            {comparison.upload1Id}
                          </span>
                          <span className="text-xs text-slate-500">مقابل</span>
                          <span className="font-semibold text-emerald-200">
                            {comparison.upload2Id}
                          </span>
                        </p>
                        <p className="text-xs text-slate-400 flex items-center gap-2">
                          <CalendarClock className="h-3.5 w-3.5" />
                          {comparison.createdAt
                            ? new Date(comparison.createdAt).toLocaleString()
                            : "—"}
                        </p>
                        {comparison.projectId && (
                          <p className="text-xs text-slate-400 flex items-center gap-2">
                            <FolderGit2 className="h-3.5 w-3.5" />
                            المشروع: <span className="text-slate-200">{comparison.projectId}</span>
                          </p>
                        )}
                      </div>
                      {statusBadge}
                    </div>

                    {structuredResult ? (
                      <div className="mt-4 space-y-4">
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
                            <p className="text-xs text-slate-400">عدد الملفات المقارنة</p>
                            <p className="mt-1 flex items-center gap-2 text-lg font-semibold text-slate-100">
                              <FileDiff className="h-4 w-4 text-sky-300" />
                              {overview?.totalFilesCompared ?? "—"}
                            </p>
                          </div>
                          <div className="rounded-xl border border-emerald-800/40 bg-emerald-900/20 p-3">
                            <p className="text-xs text-emerald-200">ملفات مضافة</p>
                            <p className="mt-1 flex items-center gap-2 text-lg font-semibold text-emerald-100">
                              <PlusCircle className="h-4 w-4" />
                              {overview?.addedFilesCount ?? filesSummary?.addedFiles?.length ?? 0}
                            </p>
                          </div>
                          <div className="rounded-xl border border-rose-800/40 bg-rose-900/20 p-3">
                            <p className="text-xs text-rose-200">ملفات محذوفة</p>
                            <p className="mt-1 flex items-center gap-2 text-lg font-semibold text-rose-100">
                              <MinusCircle className="h-4 w-4" />
                              {overview?.removedFilesCount ??
                                filesSummary?.removedFiles?.length ??
                                0}
                            </p>
                          </div>
                          <div className="rounded-xl border border-amber-800/40 bg-amber-900/20 p-3">
                            <p className="text-xs text-amber-200">ملفات معدلة</p>
                            <p className="mt-1 flex items-center gap-2 text-lg font-semibold text-amber-100">
                              <Fingerprint className="h-4 w-4" />
                              {overview?.changedFilesCount ??
                                filesSummary?.changedFiles?.length ??
                                0}
                            </p>
                          </div>
                        </div>

                        {(filesSummary?.addedFiles?.length ||
                          filesSummary?.removedFiles?.length ||
                          filesSummary?.changedFiles?.length) && (
                          <div className="grid gap-3 md:grid-cols-3">
                            {filesSummary?.addedFiles?.length ? (
                              <div className="rounded-lg border border-emerald-800/30 bg-emerald-900/10 p-3">
                                <h4 className="flex items-center gap-2 text-sm font-medium text-emerald-200">
                                  <PlusCircle className="h-4 w-4" /> الملفات المضافة
                                </h4>
                                <ul className="mt-2 space-y-1 text-xs text-emerald-100/90">
                                  {filesSummary.addedFiles.slice(0, 5).map((path: string) => (
                                    <li key={path} className="truncate">
                                      {path}
                                    </li>
                                  ))}
                                  {filesSummary.addedFiles.length > 5 && (
                                    <li className="text-emerald-200/70">
                                      + {filesSummary.addedFiles.length - 5} ملفات أخرى
                                    </li>
                                  )}
                                </ul>
                              </div>
                            ) : null}

                            {filesSummary?.removedFiles?.length ? (
                              <div className="rounded-lg border border-rose-800/30 bg-rose-900/10 p-3">
                                <h4 className="flex items-center gap-2 text-sm font-medium text-rose-200">
                                  <MinusCircle className="h-4 w-4" /> الملفات المحذوفة
                                </h4>
                                <ul className="mt-2 space-y-1 text-xs text-rose-100/90">
                                  {filesSummary.removedFiles.slice(0, 5).map((path: string) => (
                                    <li key={path} className="truncate">
                                      {path}
                                    </li>
                                  ))}
                                  {filesSummary.removedFiles.length > 5 && (
                                    <li className="text-rose-200/70">
                                      + {filesSummary.removedFiles.length - 5} ملفات أخرى
                                    </li>
                                  )}
                                </ul>
                              </div>
                            ) : null}

                            {filesSummary?.changedFiles?.length ? (
                              <div className="rounded-lg border border-amber-800/30 bg-amber-900/10 p-3">
                                <h4 className="flex items-center gap-2 text-sm font-medium text-amber-200">
                                  <Fingerprint className="h-4 w-4" /> الملفات المعدلة
                                </h4>
                                <ul className="mt-2 space-y-1 text-xs text-amber-100/90">
                                  {filesSummary.changedFiles.slice(0, 5).map((path: string) => (
                                    <li key={path} className="truncate">
                                      {path}
                                    </li>
                                  ))}
                                  {filesSummary.changedFiles.length > 5 && (
                                    <li className="text-amber-200/70">
                                      + {filesSummary.changedFiles.length - 5} ملفات أخرى
                                    </li>
                                  )}
                                </ul>
                              </div>
                            ) : null}
                          </div>
                        )}

                        {changes?.length ? (
                          <div className="rounded-lg border border-slate-800/50 bg-slate-900/20">
                            <div className="flex items-center justify-between border-b border-slate-800/40 px-4 py-2.5">
                              <h4 className="text-sm font-medium text-slate-200 flex items-center gap-2">
                                <FileDiff className="h-4 w-4 text-sky-300" /> أبرز الفروقات
                              </h4>
                              <span className="text-xs text-slate-500">
                                عرض أول {Math.min(changes.length, 5)} من {changes.length}
                              </span>
                            </div>
                            <ul className="divide-y divide-slate-800/50">
                              {changes.slice(0, 5).map((change: any, index: number) => (
                                <li
                                  key={`${comparison.id}-change-${index}`}
                                  className="px-4 py-3 text-xs"
                                >
                                  <p className="font-medium text-slate-200 flex items-start gap-2">
                                    <span
                                      className={
                                        change.changeType === "added"
                                          ? "text-emerald-300"
                                          : change.changeType === "removed"
                                            ? "text-rose-300"
                                            : "text-amber-300"
                                      }
                                    >
                                      {change.changeType === "added"
                                        ? "+"
                                        : change.changeType === "removed"
                                          ? "-"
                                          : "±"}
                                    </span>
                                    <span className="truncate" title={change.path}>
                                      {change.path}
                                    </span>
                                  </p>
                                  {change.summary && (
                                    <pre className="mt-2 rounded bg-slate-950/60 p-2 text-[11px] leading-relaxed text-slate-300 whitespace-pre-wrap">
                                      {change.summary}
                                    </pre>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}

                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                          {structuredResult.diffSize !== undefined && (
                            <span className="flex items-center gap-2 rounded-full border border-slate-800/50 bg-slate-900/30 px-3 py-1">
                              <Fingerprint className="h-3.5 w-3.5 text-slate-300" />
                              الفرق في الحجم: {formatByteSize(structuredResult.diffSize)}
                            </span>
                          )}
                          {structuredResult.sameChecksum !== undefined && (
                            <span className="flex items-center gap-2 rounded-full border border-slate-800/50 bg-slate-900/30 px-3 py-1">
                              <Fingerprint
                                className={`h-3.5 w-3.5 ${structuredResult.sameChecksum ? "text-emerald-300" : "text-amber-300"}`}
                              />
                              {structuredResult.sameChecksum ? "نفس البصمة الرقمية" : "بصمة مختلفة"}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : comparison.result ? (
                      <div className="mt-4 rounded-lg border border-slate-800/50 bg-slate-900/20 p-3">
                        <p className="text-xs text-slate-300 whitespace-pre-wrap">
                          {typeof comparison.result === "string"
                            ? comparison.result
                            : JSON.stringify(comparison.result, null, 2)}
                        </p>
                      </div>
                    ) : null}

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 border-slate-700/60 text-slate-200 hover:bg-slate-800/40"
                        onClick={() =>
                          router.push(
                            `/${locale}/user/dashboard/comparisons?comparisonId=${comparison.id}`,
                          )
                        }
                      >
                        <Eye className="h-3.5 w-3.5" /> عرض كامل
                      </Button>
                      {comparison.result && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2 text-xs text-slate-400 hover:text-slate-200"
                          onClick={() => {
                            const serialized =
                              typeof comparison.result === "string"
                                ? comparison.result
                                : JSON.stringify(comparison.result, null, 2);
                            navigator.clipboard.writeText(serialized).catch(() => undefined);
                          }}
                        >
                          <Copy className="h-3.5 w-3.5" /> نسخ الملخص
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
