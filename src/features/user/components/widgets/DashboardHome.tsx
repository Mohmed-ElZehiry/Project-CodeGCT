"use client";

import React, { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/shared/hooks/useAuth";
import { useReports } from "@/features/user/hooks/reports/useReports";
import { useUploads } from "@/features/user/hooks/useUploads";
import { useComparisons } from "@/features/user/hooks/useComparisons";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import EmptyState from "./EmptyState";
import { RefreshButton } from "@/shared/components/ui/refresh-button";

import {
  UploadCloud,
  FileText,
  GitCompare,
  FolderKanban,
  LineChart,
  Rocket,
  Archive,
} from "lucide-react";

function formatDate(value?: string | null) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default function DashboardHome() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    uploads,
    loading: uploadsLoading,
    error: uploadsError,
    refreshUploads,
  } = useUploads(user?.id);
  const {
    reports,
    loading: reportsLoading,
    error: reportsError,
    refetch: refetchReports,
    lastFetchedAt: reportsUpdatedAt,
  } = useReports();
  const {
    comparisons,
    loading: comparisonsLoading,
    error: comparisonsError,
    refetch: refetchComparisons,
    lastFetchedAt: comparisonsUpdatedAt,
  } = useComparisons();

  const userId = user?.id;

  const handleRefresh = useCallback(async () => {
    if (!userId) return;
    await Promise.allSettled([refreshUploads(userId), refetchReports(), refetchComparisons()]);
  }, [userId, refreshUploads, refetchReports, refetchComparisons]);

  const isRefreshing = uploadsLoading || reportsLoading || comparisonsLoading;

  if (!user) {
    return <div className="text-center text-destructive">⚠️ يجب تسجيل الدخول أولاً</div>;
  }

  const uniqueProjects = useMemo(() => {
    const ids = new Set(
      (uploads || []).map((u) => u.projectId).filter((id): id is string => Boolean(id)),
    );
    return ids.size;
  }, [uploads]);

  const readyUploads = useMemo(
    () =>
      (uploads || []).filter((u) =>
        ["ready", "processed", "documented"].includes(u.status as string),
      ).length,
    [uploads],
  );

  const summaryCards = useMemo(
    () => [
      {
        label: "إجمالي الملفات",
        value: uploads?.length ?? 0,
        hint: readyUploads > 0 ? `${readyUploads} ملف جاهز للمعالجة` : "لا توجد ملفات جاهزة بعد",
        icon: UploadCloud,
      },
      {
        label: "التقارير",
        value: reports?.length ?? 0,
        hint: reportsUpdatedAt
          ? `آخر تحديث: ${formatDate(reportsUpdatedAt.toISOString())}`
          : "لا توجد بيانات محدثة",
        icon: FileText,
      },
      {
        label: "المقارنات",
        value: comparisons?.length ?? 0,
        hint: comparisonsUpdatedAt
          ? `آخر تحديث: ${formatDate(comparisonsUpdatedAt.toISOString())}`
          : "لا توجد مقارنات بعد",
        icon: GitCompare,
      },
      {
        label: "المشاريع",
        value: uniqueProjects,
        hint: uniqueProjects ? "تم توزيع الملفات على مشاريع متعددة" : "قم بإنشاء مشروع عند الرفع",
        icon: FolderKanban,
      },
    ],
    [
      uploads?.length,
      readyUploads,
      reports?.length,
      reportsUpdatedAt,
      comparisons?.length,
      comparisonsUpdatedAt,
      uniqueProjects,
    ],
  );

  const latestUploads = useMemo(() => (uploads || []).slice(0, 4), [uploads]);
  const latestReports = useMemo(() => (reports || []).slice(0, 4), [reports]);
  const latestComparisons = useMemo(() => (comparisons || []).slice(0, 4), [comparisons]);

  const quickActions = [
    {
      label: "رفع ملف",
      description: "ابدأ برفع ملف جديد وربطه بمشروع",
      icon: UploadCloud,
      onClick: () => router.push("/user/dashboard/uploads"),
    },
    {
      label: "تشغيل التحليل",
      description: "اختر إصدارًا وشغّل التحليل لسيناريو سريع",
      icon: LineChart,
      onClick: () => router.push("/user/dashboard/analyze"),
    },
    {
      label: "إدارة المقارنات",
      description: "قارن بين الإصدارات المختلفة ضمن المشروع",
      icon: GitCompare,
      onClick: () => router.push("/user/dashboard/comparisons"),
    },
    {
      label: "إدارة التقارير",
      description: "استعرض التقارير السابقة وصدّر النتائج",
      icon: FileText,
      onClick: () => router.push("/user/dashboard/reports"),
    },
    {
      label: "تصفح الأرشيف",
      description: "راجع الملفات المؤرشفة حسب المشاريع",
      icon: Archive,
      onClick: () => router.push("/user/dashboard/archive"),
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">📊 لوحة التحكم الرئيسية</h1>
          <p className="text-sm text-muted-foreground">
            نظرة سريعة على آخر التحركات عبر المشاريع والملفات والتقارير.
          </p>
          {(uploadsError || reportsError || comparisonsError) && (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {uploadsError && <p>ملفات: {uploadsError}</p>}
              {reportsError && <p>تقارير: {reportsError}</p>}
              {comparisonsError && <p>مقارنات: {comparisonsError}</p>}
            </div>
          )}
        </div>
        <RefreshButton
          onRefresh={handleRefresh}
          loading={isRefreshing}
          label="تحديث البيانات"
          className="self-start sm:self-auto"
          size="default"
        />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="border-border/60 bg-card/60 shadow-sm backdrop-blur">
              <CardContent className="flex flex-col gap-3 p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <span className="rounded-full bg-primary/10 p-2 text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
                <p className="text-2xl font-semibold text-foreground">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.hint}</p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">أحدث الملفات</CardTitle>
          </CardHeader>
          <CardContent>
            {uploadsLoading ? (
              <EmptyState message="جاري تحميل الملفات..." loading />
            ) : latestUploads.length === 0 ? (
              <EmptyState message="لا توجد ملفات مرفوعة بعد" />
            ) : (
              <ul className="space-y-3">
                {latestUploads.map((upload) => (
                  <li
                    key={upload.id}
                    className="rounded-lg border border-border/60 bg-card/70 p-3 text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">{upload.originalFilename}</span>
                      <Badge variant="outline">v{upload.version}</Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>المشروع: {upload.projectId ?? "—"}</span>
                      <span>الحالة: {upload.status}</span>
                      <span>{formatDate(upload.uploadedAt)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">أحدث التقارير</CardTitle>
          </CardHeader>
          <CardContent>
            {reportsLoading ? (
              <EmptyState message="جاري تحميل التقارير..." loading />
            ) : latestReports.length === 0 ? (
              <EmptyState message="لا توجد تقارير حتى الآن" />
            ) : (
              <ul className="space-y-3">
                {latestReports.map((report) => (
                  <li
                    key={report.id}
                    className="rounded-lg border border-border/60 bg-card/70 p-3 text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">
                        {report.name ?? `Report-${report.id.slice(0, 6)}`}
                      </span>
                      <Badge variant="outline">{report.format.toUpperCase()}</Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>المشروع: {report.projectId ?? "—"}</span>
                      <span>الحالة: {report.status}</span>
                      <span>{formatDate(report.createdAt)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">أحدث المقارنات</CardTitle>
          </CardHeader>
          <CardContent>
            {comparisonsLoading ? (
              <EmptyState message="جاري تحميل المقارنات..." loading />
            ) : latestComparisons.length === 0 ? (
              <EmptyState message="لا توجد مقارنات محفوظة" />
            ) : (
              <ul className="space-y-3">
                {latestComparisons.map((comparison) => (
                  <li
                    key={comparison.id}
                    className="rounded-lg border border-border/60 bg-card/70 p-3 text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">
                        {comparison.metadata?.fileA ?? comparison.upload1Id} 🔀{" "}
                        {comparison.metadata?.fileB ?? comparison.upload2Id}
                      </span>
                      <Badge variant="outline">{comparison.status}</Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>المشروع: {comparison.projectId ?? "—"}</span>
                      <span>{formatDate(comparison.createdAt)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Rocket className="h-5 w-5 text-primary" /> إجراءات سريعة
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Card
                key={action.label}
                className="border-border/60 bg-card/60 shadow-sm backdrop-blur"
              >
                <CardContent className="flex flex-col gap-3 p-5">
                  <div className="flex items-center gap-2 text-primary">
                    <Icon className="h-5 w-5" />
                    <span className="font-semibold text-foreground">{action.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-auto w-fit"
                    onClick={action.onClick}
                  >
                    انتقل الآن
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
