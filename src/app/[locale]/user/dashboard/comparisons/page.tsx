// src/app/[locale]/user/dashboard/comparisons/page.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import WidgetContainer from "@/shared/components/layout/Dashboard/WidgetContainer";
import { Squares2X2Icon } from "@heroicons/react/24/outline";
import type { Upload } from "@/features/user/types/user";
import { useNotification } from "@/features/user/context/NotificationContext";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { AlertTriangle, Files, GitCompare, Layers } from "lucide-react";

type ProjectSummary = {
  id: string;
  name: string;
  description?: string | null;
  code?: string | null;
};

const NO_PROJECT_VALUE = "__NO_PROJECT__";

export default function ComparisonsPage() {
  const { notifyError, notifySuccess } = useNotification();

  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [projectsLoading, setProjectsLoading] = useState<boolean>(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string | undefined>(undefined);

  const [fileA, setFileA] = useState<string>("");
  const [fileB, setFileB] = useState<string>("");
  const [isComparing, setIsComparing] = useState(false);
  const [comparison, setComparison] = useState<any | null>(null);

  const locale = useMemo(
    () => (typeof window !== "undefined" ? window.location.pathname.split("/")[1] || "en" : "en"),
    [],
  );

  const hasUnassignedUploads = useMemo(
    () => uploads.some((upload) => !upload.projectId),
    [uploads],
  );

  useEffect(() => {
    const loadUploads = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/user/uploads");
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || "Failed to fetch uploads");
        setUploads(json.data || []);
        setError(null);
      } catch (err: any) {
        console.error("❌ [DEBUG] loadUploads error:", err);
        setError(err.message || "Unknown error");
        notifyError("❌ حدث خطأ أثناء تحميل الملفات", err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    loadUploads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      setProjects([]);
      setProjectsError(err?.message || "حدث خطأ أثناء تحميل المشاريع");
    } finally {
      setProjectsLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

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
    setFileA("");
    setFileB("");
    setComparison(null);
  }, [selectedFilter]);

  const selectedProjectId = useMemo(() => {
    if (!selectedFilter) return undefined;
    return selectedFilter === NO_PROJECT_VALUE ? null : selectedFilter;
  }, [selectedFilter]);

  const filteredUploads = useMemo(() => {
    if (selectedFilter === undefined) return [];
    const targetProjectId = selectedFilter === NO_PROJECT_VALUE ? null : selectedFilter;
    return uploads.filter((upload) =>
      targetProjectId === null ? upload.projectId === null : upload.projectId === targetProjectId,
    );
  }, [selectedFilter, uploads]);

  const fileOptions = useMemo(() => {
    const optionsA = filteredUploads.map((upload) => ({
      id: upload.id,
      label: `${upload.originalFilename}${upload.projectId ? ` · ${upload.projectId}` : " · بدون مشروع"}`,
      disabled: upload.id === fileB,
    }));

    const optionsB = filteredUploads
      .filter((upload) => upload.id !== fileA)
      .map((upload) => ({
        id: upload.id,
        label: `${upload.originalFilename}${upload.projectId ? ` · ${upload.projectId}` : " · بدون مشروع"}`,
        disabled: upload.id === fileA,
      }));

    return { optionsA, optionsB };
  }, [filteredUploads, fileA, fileB]);

  const projectUploadsCount = filteredUploads.length;

  const selectedProjectLabel = useMemo(() => {
    if (selectedProjectId === undefined) return null;
    if (selectedProjectId === null) return "بدون مشروع";
    const match = projects.find((project) => project.id === selectedProjectId);
    return match ? match.name : selectedProjectId;
  }, [projects, selectedProjectId]);

  const handleCompare = async () => {
    if (!fileA || !fileB) {
      notifyError("⚠️ خطأ في المقارنة", "الرجاء اختيار ملفين للمقارنة");
      return;
    }

    if (fileA === fileB) {
      notifyError("⚠️ خطأ في المقارنة", "لا يمكن مقارنة نفس الملف بنفسه");
      return;
    }

    const uploadA = filteredUploads.find((upload) => upload.id === fileA);
    const uploadB = filteredUploads.find((upload) => upload.id === fileB);

    if (!uploadA || !uploadB) {
      notifyError("⚠️ خطأ في المقارنة", "تعذر العثور على الملفات المحددة");
      return;
    }

    if (selectedProjectId === undefined) {
      notifyError("⚠️ خطأ في المقارنة", "يرجى اختيار مشروع أولاً");
      return;
    }

    setComparison(null);

    setIsComparing(true);
    try {
      const res = await fetch(`/${locale}/api/user/comparisons/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          upload1Id: fileA,
          upload2Id: fileB,
          projectId: selectedProjectId ?? null,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "فشلت عملية المقارنة");
      }

      notifySuccess("✅ تمت المقارنة بنجاح وتم حفظ النتيجة", undefined, 3000);
      setComparison(json.data?.result ?? json.data);
    } catch (err: any) {
      console.error("Comparison failed:", err);
      notifyError("❌ فشلت عملية المقارنة", err.message || "يرجى المحاولة مرة أخرى");
    } finally {
      setIsComparing(false);
    }
  };

  const previewSummary = useMemo(() => {
    if (!fileA || !fileB) return null;

    const uploadA = filteredUploads.find((upload) => upload.id === fileA);
    const uploadB = filteredUploads.find((upload) => upload.id === fileB);
    if (!uploadA || !uploadB) return null;

    const diffSize = Math.abs((uploadA.fileSize ?? 0) - (uploadB.fileSize ?? 0));
    const sameChecksum = Boolean(
      uploadA.checksum && uploadB.checksum && uploadA.checksum === uploadB.checksum,
    );

    return { diffSize, sameChecksum };
  }, [filteredUploads, fileA, fileB]);

  const renderSelect = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    options: { id: string; label: string; disabled?: boolean }[],
    placeholder: string,
    disabled?: boolean,
  ) => (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading || isComparing || disabled}
        className="w-full p-2 rounded-lg border bg-card text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <WidgetContainer
      title="File Comparisons"
      description="قم باختيار ملفين من نفس المشروع لمقارنة الاختلافات بين الإصدارات"
    >
      {loading && <p className="text-sm text-muted-foreground">⏳ جاري تحميل الملفات...</p>}
      {error && <p className="text-sm text-destructive">❌ خطأ: {String(error)}</p>}

      {!loading && uploads.length > 0 ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">المشروع المستهدف</label>
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
              disabled={projectsLoading}
              aria-label="اختيار المشروع للمقارنة"
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
                ⚠️ اختر مشروعًا لعرض الإصدارات المتاحة.
              </p>
            )}
            {projectsLoading && (
              <p className="text-xs text-muted-foreground">⏳ جاري تحميل المشاريع...</p>
            )}
          </div>

          {/* ✅ اختيار الملف الأول */}
          {/* ✅ اختيار الملف الأول */}
          {renderSelect(
            "الملف الأول",
            fileA,
            setFileA,
            fileOptions.optionsA,
            "-- اختر الإصدار الأول --",
            selectedFilter === undefined || fileOptions.optionsA.length === 0,
          )}

          {/* ✅ اختيار الملف الثاني */}
          {renderSelect(
            "الملف الثاني",
            fileB,
            setFileB,
            fileOptions.optionsB,
            "-- اختر الإصدار الثاني --",
            selectedFilter === undefined || fileOptions.optionsB.length === 0,
          )}

          {selectedFilter !== undefined && filteredUploads.length < 2 && (
            <p className="text-xs text-amber-600 flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" /> لا توجد إصدارات كافية ضمن هذا المشروع لإجراء
              المقارنة.
            </p>
          )}

          {selectedFilter !== undefined && fileA && !fileB && filteredUploads.length >= 2 && (
            <p className="text-xs text-amber-600 flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" /> اختر إصدارًا آخر من نفس المشروع لإتمام المقارنة.
            </p>
          )}

          {selectedProjectId !== undefined && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Layers className="h-4 w-4" /> مشروع مرتبط:{" "}
                  <Badge variant="secondary">{selectedProjectLabel}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-2">
                <p>عدد الإصدارات المتاحة ضمن هذا المشروع: {projectUploadsCount}</p>
              </CardContent>
            </Card>
          )}

          {previewSummary && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <GitCompare className="h-4 w-4" /> ملخص سريع قبل المقارنة
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-1">
                <p>
                  🔀 الفرق في الحجم:{" "}
                  <strong>{previewSummary.diffSize.toLocaleString()} بايت</strong>
                </p>
                <p>
                  {previewSummary.sameChecksum ? (
                    <span className="text-green-600">✅ الملفات متطابقة (Checksum)</span>
                  ) : (
                    <span className="text-amber-600">⚠️ يوجد اختلاف في المحتوى</span>
                  )}
                </p>
              </CardContent>
            </Card>
          )}

          {/* ✅ زر المقارنة */}
          <Button
            onClick={handleCompare}
            disabled={
              !fileA ||
              !fileB ||
              isComparing ||
              selectedFilter === undefined ||
              filteredUploads.length < 2
            }
            className="relative flex items-center gap-2 w-full sm:w-auto"
          >
            {isComparing && (
              <span className="absolute inset-0 flex items-center justify-center gap-1 text-sm">
                <span
                  className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                  aria-hidden="true"
                />
                <span>جاري تنفيذ المقارنة...</span>
              </span>
            )}
            <span className={isComparing ? "opacity-0" : "flex items-center gap-2"}>
              <Squares2X2Icon className="w-5 h-5" />
              <span>تنفيذ المقارنة</span>
            </span>
          </Button>

          {comparison && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Files className="h-4 w-4" /> نتيجة المقارنة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <Badge variant="outline">الملف الأول: {comparison.fileA}</Badge>
                  <Badge variant="outline">الملف الثاني: {comparison.fileB}</Badge>
                  {comparison.projectId && (
                    <Badge variant="outline">المشروع: {comparison.projectId}</Badge>
                  )}
                </div>

                {comparison.overview && (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <SummaryCard
                      label="عدد الملفات المقارنة"
                      value={comparison.overview.totalFilesCompared}
                    />
                    <SummaryCard
                      label="الملفات المعدلة"
                      value={comparison.overview.changedFilesCount}
                    />
                    <SummaryCard
                      label="الملفات المضافة"
                      value={comparison.overview.addedFilesCount}
                    />
                    <SummaryCard
                      label="الملفات المحذوفة"
                      value={comparison.overview.removedFilesCount}
                    />
                  </div>
                )}

                {comparison.changes?.length ? (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">أبرز التغييرات:</h4>
                    <ul className="space-y-1 text-xs font-mono bg-muted/50 p-3 rounded">
                      {comparison.changes.slice(0, 10).map((change: any, index: number) => (
                        <li key={`${change.path}-${index}`} className="flex flex-col">
                          <span className="font-semibold">{change.path}</span>
                          <span className="text-muted-foreground whitespace-pre-wrap">
                            {change.summary || "(لا يوجد تفاصيل)"}
                          </span>
                        </li>
                      ))}
                    </ul>
                    {comparison.changes.length > 10 && (
                      <p className="text-xs text-muted-foreground">عرض أول 10 تغييرات فقط.</p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <AlertTriangle className="h-4 w-4" /> لا توجد تغييرات ملفتة بين الإصدارين.
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">⚠️ لا توجد ملفات مرفوعة للمقارنة</p>
      )}
    </WidgetContainer>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border bg-card/80 p-3 text-center shadow-sm">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
