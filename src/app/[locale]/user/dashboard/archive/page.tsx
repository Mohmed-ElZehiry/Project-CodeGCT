// src/app/[locale]/user/dashboard/archive/page.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Trash2, Eye, RefreshCw, Info } from "lucide-react";
import { useNotification } from "@/features/user/context/NotificationContext";
import { useReports } from "@/features/user/hooks/reports/useReports";
import type { Upload } from "@/features/user/types/user";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

type ProjectSummary = {
  id: string;
  name: string;
  description?: string | null;
  code?: string | null;
};

const NO_PROJECT_VALUE = "__NO_PROJECT__";

export default function ArchivePage() {
  const router = useRouter();
  const { notifyError, notifySuccess } = useNotification();

  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loadingUploads, setLoadingUploads] = useState(false);
  const [uploadsError, setUploadsError] = useState<string | null>(null);

  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  const [selectedFilter, setSelectedFilter] = useState<string | undefined>(undefined);
  const [selectedUploadId, setSelectedUploadId] = useState<string>("");

  const { reports, loading: reportsLoading } = useReports();

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
  }, [uploads, selectedFilter]);

  const selectedUpload = useMemo(
    () => filteredUploads.find((upload) => upload.id === selectedUploadId) ?? null,
    [filteredUploads, selectedUploadId],
  );

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
        throw new Error(json.error || "فشل في تحميل الملفات");
      }
      setUploads(json.data || []);
    } catch (err: any) {
      const message = err?.message || "حدث خطأ أثناء تحميل الملفات";
      setUploadsError(message);
      notifyError("❌ خطأ أثناء تحميل الملفات", message);
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
      setProjectsError(message);
      setProjects([]);
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
        setSelectedUploadId("");
      } else if (!projects.length && hasUnassignedUploads) {
        setSelectedFilter(NO_PROJECT_VALUE);
        setSelectedUploadId("");
      }
    }
  }, [projects, projectsLoading, hasUnassignedUploads, selectedFilter]);

  useEffect(() => {
    if (filteredUploads.length && !filteredUploads.some((item) => item.id === selectedUploadId)) {
      setSelectedUploadId(filteredUploads[0].id);
    }
  }, [filteredUploads, selectedUploadId]);

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes || bytes <= 0) return "-";
    const units = ["بايت", "كيلوبايت", "ميجابايت", "جيجابايت"];
    const index = Math.floor(Math.log(bytes) / Math.log(1024));
    const value = bytes / Math.pow(1024, index);
    return `${value.toFixed(2)} ${units[index] ?? "بايت"}`;
  };

  const getStatusVariant = (status?: string | null) => {
    if (!status) return "secondary";
    const map: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      analyzing: "secondary",
      ready: "default",
      compared: "default",
      documented: "default",
      failed: "destructive",
    };
    return map[status] || "outline";
  };

  const formatStatus = (status?: string | null) => {
    if (!status) return "غير محدد";
    const map: Record<string, string> = {
      pending: "قيد الانتظار",
      analyzing: "جاري التحليل",
      ready: "جاهز",
      compared: "تمت المقارنة",
      documented: "موثق",
      failed: "فشل",
    };
    return map[status] || status;
  };

  const handleDownload = (upload: Upload) => {
    if (!upload.githubUrl) {
      notifyError("❌ لا يتوفر رابط تحميل", "هذا الملف لا يحتوي على رابط GitHub صالح");
      return;
    }
    window.open(upload.githubUrl, "_blank", "noopener,noreferrer");
    notifySuccess("✅ تم فتح رابط التحميل في علامة تبويب جديدة", undefined, 3000);
  };

  const handleDelete = async (id: string, filename: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الملف؟")) return;
    try {
      const res = await fetch(`/api/user/uploads/${encodeURIComponent(id)}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "فشل في حذف الملف");
      }
      setUploads((prev) => prev.filter((upload) => upload.id !== id));
      notifySuccess(`🗑️ تم حذف ${filename}`, undefined, 4000);
    } catch (err: any) {
      notifyError("❌ خطأ أثناء حذف الملف", err?.message || "يرجى المحاولة مرة أخرى");
    }
  };

  const handleViewDetails = (upload: Upload) => {
    const relatedReport = reports.find((r) => r.uploadId === upload.id);
    if (relatedReport) {
      router.push(`/${locale}/user/dashboard/reports/${relatedReport.id}`);
    }
  };

  const renderUploadCard = (upload: Upload) => {
    const isActive = upload.id === selectedUploadId;
    const relatedReport = reports.find((r) => r.uploadId === upload.id);

    return (
      <div
        key={upload.id}
        className={`w-full rounded-lg border p-4 shadow-sm transition ${
          isActive ? "border-primary bg-primary/5" : "border-muted bg-card"
        }`}
      >
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-start">
            <span className="font-semibold text-sm">{upload.originalFilename}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            بتاريخ {upload.uploadedAt ? new Date(upload.uploadedAt).toLocaleString() : "غير متاح"}
          </span>
          <div className="flex flex-wrap gap-2 items-center text-xs text-muted-foreground">
            <Badge variant="outline">الحجم: {formatFileSize(upload.fileSize)}</Badge>
            <Badge variant={getStatusVariant(upload.status)}>{formatStatus(upload.status)}</Badge>
            <Badge variant="outline">الإصدار: v{upload.version}</Badge>
          </div>
          <div className="flex justify-end gap-2 mt-2"></div>
        </div>
      </div>
    );
  };

  const renderUploadDetails = (upload: Upload) => {
    const relatedReport = reports.find((r) => r.uploadId === upload.id);
    const reportVersion = (() => {
      if (!relatedReport) return upload.version?.toString() ?? "1.0.0";
      if (
        typeof relatedReport.content === "object" &&
        relatedReport.content !== null &&
        "version" in relatedReport.content
      ) {
        const value = (relatedReport.content as { version?: unknown }).version;
        if (typeof value === "string" || typeof value === "number") {
          return value.toString();
        }
      }
      return upload.version?.toString() ?? "1.0.0";
    })();

    return (
      <div className="space-y-4">
        {relatedReport ? (
          <div className="border rounded-lg p-4 bg-card">
            <h3 className="text-lg font-semibold mb-3">تفاصيل التقرير</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <p>
                  <strong>حالة التقرير:</strong> {formatStatus(relatedReport.status)}
                </p>
                <p>
                  <strong>تاريخ الإنشاء:</strong>{" "}
                  {relatedReport.createdAt
                    ? new Date(relatedReport.createdAt).toLocaleString()
                    : "غير معروف"}
                </p>
                <p>
                  <strong>آخر تحديث:</strong>{" "}
                  {relatedReport.updatedAt
                    ? new Date(relatedReport.updatedAt).toLocaleString()
                    : "غير معروف"}
                </p>
              </div>
              <div className="space-y-2">
                <p>
                  <strong>عدد الملفات:</strong> {relatedReport.structure?.tree?.length || 0}
                </p>
                <p>
                  <strong>إصدار التقرير:</strong> v{reportVersion}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <Button onClick={() => handleViewDetails(upload)} className="flex items-center gap-2">
                <Eye className="w-4 h-4" /> عرض التقرير الكامل
              </Button>
            </div>
          </div>
        ) : (
          <div className="border rounded-lg p-4 bg-card">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Info className="w-5 h-5" />
              <p>لا يوجد تحليل متاح لهذا الملف حالياً.</p>
            </div>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">تفاصيل الملف</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">الاسم:</strong> {upload.originalFilename}
            </p>
            <p>
              <strong className="text-foreground">المشروع:</strong>{" "}
              {selectedProjectLabel ?? upload.projectId ?? "—"}
            </p>
            <p>
              <strong className="text-foreground">الحجم:</strong> {formatFileSize(upload.fileSize)}
            </p>
            <p>
              <strong className="text-foreground">الحالة:</strong> {formatStatus(upload.status)}
            </p>
            <p>
              <strong className="text-foreground">تاريخ الرفع:</strong>{" "}
              {upload.uploadedAt ? new Date(upload.uploadedAt).toLocaleString() : "غير متاح"}
            </p>
            <p>
              <strong className="text-foreground">عنوان GitHub:</strong>{" "}
              {upload.githubUrl ? "متوفر" : "غير متوفر"}
            </p>

            <div className="pt-2 flex flex-wrap gap-3">
              <Button
                variant="secondary"
                onClick={() => handleDownload(upload)}
                disabled={!upload.githubUrl}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> تحميل
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDelete(upload.id, upload.originalFilename)}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> حذف
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const filteredCount = filteredUploads.length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">📦 الأرشيف</h1>
        <p className="text-sm text-muted-foreground">
          اعرض كل الملفات المرفوعة مُصنفة حسب المشروع، وحمّل أو احذف ما لم تعد بحاجة إليه.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={loadUploads}
          disabled={loadingUploads}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loadingUploads ? "animate-spin" : ""}`} /> تحديث القائمة
        </Button>
        {uploadsError && <p className="text-xs text-destructive">❌ {uploadsError}</p>}
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
              setSelectedUploadId("");
            }}
            disabled={projectsLoading || loadingUploads}
            aria-label="اختيار المشروع لعرض الملفات المؤرشفة"
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
            <p className="text-xs text-muted-foreground">
              ⚠️ اختر مشروعًا لعرض الملفات المؤرشفة المرتبطة به.
            </p>
          )}
          {selectedProjectId !== undefined && (
            <p className="text-xs text-muted-foreground">
              المشروع المختار:{" "}
              <span className="text-foreground font-medium">{selectedProjectLabel}</span> — عدد
              الملفات: {filteredCount}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">الملفات المؤرشفة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingUploads ? (
            <p className="text-sm text-muted-foreground">⏳ جاري تحميل الملفات...</p>
          ) : selectedFilter === undefined ? (
            <p className="text-sm text-muted-foreground">اختر مشروعًا لرؤية الملفات المرتبطة به.</p>
          ) : filteredUploads.length === 0 ? (
            <p className="text-sm text-muted-foreground">⚠️ لا توجد ملفات مؤرشفة لهذا المشروع.</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-6">
              <div className="space-y-3">
                <h2 className="text-sm font-medium text-muted-foreground">قائمة الملفات</h2>
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {filteredUploads.map(renderUploadCard)}
                </div>
              </div>

              <div>
                {selectedUpload ? (
                  renderUploadDetails(selectedUpload)
                ) : (
                  <p className="text-sm text-muted-foreground">
                    اختر ملفًا من القائمة لعرض تفاصيله.
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
