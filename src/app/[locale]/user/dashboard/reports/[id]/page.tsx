// src/app/[locale]/user/dashboard/reports/[id]/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useReports } from "@/features/user/hooks/reports/useReports";
import type { AnalysisReport } from "@/features/user/types/user";
import { ReportDetails } from "@/features/user/components/reports/ReportDetails";
import { useNotification } from "@/features/user/context/NotificationContext";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Eye, Download, RefreshCcw, ArrowLeft, CalendarClock, FileText } from "lucide-react";

export default function ReportPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { readReport, exportReport } = useReports();
  const { notifyError, notifySuccess } = useNotification();

  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const res = await readReport(id);
        if (!res) throw new Error("Report not found");
        setReport(res);
        notifySuccess("📄 تم تحميل التقرير بنجاح");
      } catch (err: any) {
        notifyError("❌ فشل تحميل التقرير", err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, readReport]);

  const locale = useMemo(
    () => (typeof window !== "undefined" ? window.location.pathname.split("/")[1] || "en" : "en"),
    [],
  );

  if (loading) {
    return (
      <div className="p-6 flex flex-col gap-4">
        <div className="h-12 w-full animate-pulse rounded-xl bg-slate-800/40" />
        <div className="grid gap-3 md:grid-cols-2">
          {[...Array(4)].map((_, idx) => (
            <div key={idx} className="h-24 rounded-xl bg-slate-800/30 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-6 flex flex-col items-center justify-center gap-3 text-center text-sm text-muted-foreground">
        <p>لا يوجد تقرير متاح.</p>
        <Button
          onClick={() => router.push(`/${locale}/user/dashboard/reports`)}
          variant="outline"
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          العودة إلى لوحة التقارير
        </Button>
      </div>
    );
  }

  const handleExport = async () => {
    if (!report?.id) return;
    setExporting(true);
    try {
      const blob = await exportReport(report.id, "json");
      if (!blob) throw new Error("خطأ أثناء تصدير التقرير");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${report.id}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      notifySuccess("✅ تم تصدير التقرير بصيغة JSON");
    } catch (err: any) {
      notifyError("❌ فشل تصدير التقرير", err?.message || "يرجى المحاولة مجددًا");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 px-0"
                onClick={() => router.push(`/${locale}/user/dashboard/reports`)}
              >
                <ArrowLeft className="h-4 w-4" />
                العودة إلى التقارير
              </Button>
              <span className="text-slate-600">/</span>
              <span className="font-mono text-xs text-slate-400">{report.id}</span>
            </div>
            <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              {report.name ?? "تقرير بدون عنوان"}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge
                variant="outline"
                className="border-green-500/40 bg-green-500/10 text-green-200 capitalize"
              >
                الحالة: {report.status}
              </Badge>
              <Badge
                variant="outline"
                className="border-indigo-500/30 bg-indigo-500/10 text-indigo-200 uppercase"
              >
                {report.format}
              </Badge>
              <div className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1">
                <CalendarClock className="h-3.5 w-3.5 text-amber-300" />
                <span className="text-xs">{new Date(report.createdAt).toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              onClick={handleExport}
              disabled={exporting}
              variant="secondary"
              className="gap-2"
            >
              {exporting ? (
                <>
                  <RefreshCcw className="h-4 w-4 animate-spin" />
                  جارٍ التصدير...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  تصدير JSON
                </>
              )}
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() =>
                router.push(
                  `/${locale}/user/dashboard/reports?uploadId=${report.uploadId ?? ""}&reportId=${report.id}`,
                )
              }
            >
              <Eye className="h-4 w-4" />
              عرض في لوحة التقارير
            </Button>
          </div>
        </div>

        <Card className="border border-slate-800 bg-slate-950/70 shadow-lg shadow-slate-950/30">
          <CardContent className="grid gap-4 py-6 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <p className="text-xs text-slate-400">المشروع</p>
              <p className="text-sm font-medium text-slate-100">{report.projectId ?? "—"}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <p className="text-xs text-slate-400">الإصدار المرتبط</p>
              <p className="text-sm font-medium text-slate-100">{report.uploadId ?? "—"}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <p className="text-xs text-slate-400">عدد الملفات</p>
              <p className="text-sm font-medium text-slate-100">
                {report.structure?.tree?.length ?? 0}
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <p className="text-xs text-slate-400">آخر تحديث</p>
              <p className="text-sm font-medium text-slate-100">
                {report.updatedAt ? new Date(report.updatedAt).toLocaleString() : "—"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <ReportDetails report={report} />
    </div>
  );
}
