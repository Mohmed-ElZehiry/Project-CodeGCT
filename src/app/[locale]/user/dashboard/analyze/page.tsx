// src/app/[locale]/user/dashboard/analyze/page.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useReports } from "@/features/user/hooks/reports/useReports";
import { useNotification } from "@/features/user/context/NotificationContext";
import type { Upload } from "@/features/user/types/user";
import { useAuth } from "@/shared/hooks/useAuth";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { useRouter } from "next/navigation";

type ProjectSummary = {
  id: string;
  name: string;
  description?: string | null;
  code?: string | null;
};

const NO_PROJECT_VALUE = "__NO_PROJECT__";

export default function AnalyzePage() {
  const router = useRouter();
  const { reports, loading: reportsLoading, refetch } = useReports();
  const { notifyError, notifySuccess } = useNotification();
  const { user } = useAuth();

  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loadingUploads, setLoadingUploads] = useState(false);
  const [uploadsError, setUploadsError] = useState<string | null>(null);

  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string | undefined>(undefined);

  const [selectedUploadId, setSelectedUploadId] = useState<string>("");
  const [runningAnalysis, setRunningAnalysis] = useState(false);

  const locale = useMemo(
    () => (typeof window !== "undefined" ? window.location.pathname.split("/")[1] || "en" : "en"),
    [],
  );

  const hasUnassignedUploads = useMemo(
    () => uploads.some((upload) => !upload.projectId),
    [uploads],
  );

  const selectedProjectId = useMemo(() => {
    if (!selectedFilter) return undefined;
    return selectedFilter === NO_PROJECT_VALUE ? null : selectedFilter;
  }, [selectedFilter]);

  const filteredUploads = useMemo(() => {
    if (selectedFilter === undefined) return [];
    const target = selectedFilter === NO_PROJECT_VALUE ? null : selectedFilter;
    return uploads.filter((upload) =>
      target === null ? upload.projectId === null : upload.projectId === target,
    );
  }, [selectedFilter, uploads]);

  const selectedUpload = useMemo(
    () => filteredUploads.find((upload) => upload.id === selectedUploadId) ?? null,
    [filteredUploads, selectedUploadId],
  );

  const relatedReport = useMemo(() => {
    if (!selectedUpload) return null;
    return (
      reports.find(
        (report) => report.uploadId === selectedUpload.id && report.status === "completed",
      ) ?? null
    );
  }, [reports, selectedUpload]);

  const selectedProjectLabel = useMemo(() => {
    if (selectedProjectId === undefined) return null;
    if (selectedProjectId === null) return "بدون مشروع";
    const match = projects.find((project) => project.id === selectedProjectId);
    return match ? match.name : selectedProjectId;
  }, [projects, selectedProjectId]);

  const loadUploads = useCallback(async () => {
    setLoadingUploads(true);
    setUploadsError(null);
    try {
      const res = await fetch("/api/user/uploads");
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "تعذر تحميل الملفات المتاحة");
      }
      setUploads(json.data || []);
    } catch (err: any) {
      const message = err?.message || "خطأ غير متوقع أثناء تحميل الملفات";
      setUploadsError(message);
      notifyError("❌ حدث خطأ أثناء تحميل الملفات", message);
    } finally {
      setLoadingUploads(false);
    }
  }, [notifyError]);

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
      setProjects([]);
      setProjectsError(message);
    } finally {
      setProjectsLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    loadUploads();
    loadProjects();
  }, [loadUploads, loadProjects]);

  useEffect(() => {
    if (selectedFilter === undefined && !projectsLoading) {
      if (projects.length === 1) {
        setSelectedFilter(projects[0].id);
      } else if (!projects.length && hasUnassignedUploads) {
        setSelectedFilter(NO_PROJECT_VALUE);
      }
    }
  }, [hasUnassignedUploads, projects, projectsLoading, selectedFilter]);

  useEffect(() => {
    setSelectedUploadId("");
  }, [selectedFilter]);

  const handleSelectUpload = (uploadId: string) => {
    setSelectedUploadId(uploadId);
  };

  const handleViewReport = useCallback(() => {
    if (!relatedReport) return;
    const params = new URLSearchParams();
    params.set("reportId", relatedReport.id);
    if (relatedReport.uploadId) {
      params.set("uploadId", relatedReport.uploadId);
    }
    router.push(`/${locale}/user/dashboard/reports?${params.toString()}`);
  }, [locale, relatedReport, router]);

  const handleRunAnalysis = async () => {
    if (!selectedUpload || !user?.id) {
      notifyError("⚠️ قم باختيار ملف أولاً", "لا يمكن تشغيل التحليل بدون تحديد الملف والمستخدم");
      return;
    }

    if (selectedProjectId === undefined) {
      notifyError("⚠️ قم بتحديد مشروع", "يرجى اختيار مشروع أو ملفات بدون مشروع لبدء التحليل");
      return;
    }

    setRunningAnalysis(true);
    try {
      const targetProjectId = selectedProjectId ?? "null";
      const res = await fetch(`/${locale}/api/user/projects/${targetProjectId}/analyses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          uploadId: selectedUpload.id,
          format: "json",
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || "فشل تشغيل التحليل");
      }

      await refetch();
      notifySuccess("✅ تم تشغيل التحليل وإنشاء تقرير جديد");
    } catch (err: any) {
      notifyError("❌ فشل تشغيل التحليل", err?.message || "يرجى المحاولة مرة أخرى");
    } finally {
      setRunningAnalysis(false);
    }
  };

  const renderUploadCard = (upload: Upload) => {
    const isActive = upload.id === selectedUploadId;
    return (
      <button
        key={upload.id}
        type="button"
        onClick={() => handleSelectUpload(upload.id)}
        className={`w-full text-start rounded-lg border p-4 shadow-sm transition hover:border-primary hover:shadow-md ${
          isActive ? "border-primary bg-primary/5" : "border-muted bg-card"
        }`}
      >
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-sm">{upload.originalFilename}</span>
          <span className="text-xs text-muted-foreground">
            {new Date(upload.uploadedAt).toLocaleString()}
          </span>
          <span className="text-xs text-muted-foreground">الإصدار: v{upload.version}</span>
          {upload.status && (
            <Badge
              variant={upload.status === "ready" ? "success" : "outline"}
              className="w-fit text-xs"
            >
              {upload.status}
            </Badge>
          )}
        </div>
      </button>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">⚙️ تشغيل التحليل</h1>
        <p className="text-sm text-muted-foreground mt-1">
          اختر المشروع ثم الإصدار المطلوب لتشغيل تحليل سريع وإنشاء تقرير جديد.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">اختيار المشروع</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
            value={selectedFilter ?? ""}
            onChange={(event) => {
              const value = event.target.value;
              if (!value) {
                setSelectedFilter(undefined);
              } else {
                setSelectedFilter(value);
              }
            }}
            disabled={projectsLoading || loadingUploads}
            aria-label="اختيار المشروع للتحليل"
          >
            <option value="">-- اختر المشروع --</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.code ? `${project.name} · ${project.code}` : project.name}
              </option>
            ))}
            {hasUnassignedUploads && <option value={NO_PROJECT_VALUE}>ملفات بدون مشروع</option>}
          </select>
          {projectsError && <p className="text-xs text-destructive">❌ {projectsError}</p>}
          {selectedFilter === undefined && (
            <p className="text-xs text-muted-foreground">⚠️ اختر مشروعًا لعرض الإصدارات المتاحة.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">الإصدارات المتاحة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingUploads ? (
            <p className="text-sm text-muted-foreground">⏳ جاري تحميل الملفات...</p>
          ) : uploadsError ? (
            <p className="text-sm text-destructive">❌ {uploadsError}</p>
          ) : selectedFilter === undefined ? (
            <p className="text-sm text-muted-foreground">ابدأ باختيار مشروع لعرض الإصدارات.</p>
          ) : filteredUploads.length === 0 ? (
            <p className="text-sm text-muted-foreground">⚠️ لا توجد إصدارات ضمن هذا المشروع.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredUploads.map(renderUploadCard)}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedUpload && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">تفاصيل الإصدار</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">الملف:</strong> {selectedUpload.originalFilename}
            </p>
            <p>
              <strong className="text-foreground">الإصدار:</strong> v{selectedUpload.version}
            </p>
            <p>
              <strong className="text-foreground">تاريخ الرفع:</strong>{" "}
              {new Date(selectedUpload.uploadedAt).toLocaleString()}
            </p>
            {selectedUpload.checksum && (
              <p>
                <strong className="text-foreground">Checksum:</strong>{" "}
                {selectedUpload.checksum.slice(0, 12)}...
              </p>
            )}
            <p>
              <strong className="text-foreground">المشروع المرتبط:</strong>{" "}
              {selectedProjectLabel ?? "—"}
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Button
                onClick={handleRunAnalysis}
                disabled={runningAnalysis}
                className="w-full sm:w-auto flex items-center gap-2"
              >
                {runningAnalysis ? (
                  <>
                    <span
                      className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                      aria-hidden="true"
                    />
                    <span>جاري تشغيل التحليل...</span>
                  </>
                ) : (
                  <>ابدأ التحليل</>
                )}
              </Button>
              {relatedReport && (
                <Button
                  variant="secondary"
                  onClick={handleViewReport}
                  disabled={reportsLoading}
                  className="w-full sm:w-auto"
                >
                  {reportsLoading ? "جاري التحميل..." : "عرض التقرير"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
