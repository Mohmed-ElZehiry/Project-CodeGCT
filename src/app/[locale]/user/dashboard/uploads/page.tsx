"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import FileUploadWidget from "@/features/user/components/uploads/FileUploadWidget";
import { useNotification } from "@/features/user/context/NotificationContext";
import type { Upload } from "@/features/user/types/user";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Callout } from "@/shared/components/ui/callout";
import { useAuth } from "@/shared/hooks/useAuth";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { UploadCloud, FileSearch, GitCompare } from "lucide-react";

const NO_PROJECT_VALUE = "__NO_PROJECT__";

export default function UploadsPage() {
  const { notifySuccess, notifyError } = useNotification();
  const { userId } = useAuth();
  const locale = useLocale();
  const router = useRouter();

  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loadingUploads, setLoadingUploads] = useState(false);
  const [uploadsError, setUploadsError] = useState<string | null>(null);

  const [selectedUploadId, setSelectedUploadId] = useState<string>("");
  const [navigateError, setNavigateError] = useState<string | null>(null);

  const selectedUpload = useMemo(
    () => uploads.find((upload) => upload.id === selectedUploadId) ?? null,
    [uploads, selectedUploadId],
  );

  const canNavigateToComparison = useMemo(() => {
    if (!selectedUpload) return false;
    return uploads.some(
      (upload) =>
        upload.id !== selectedUpload.id &&
        (upload.projectId ?? null) === (selectedUpload.projectId ?? null),
    );
  }, [uploads, selectedUpload]);

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

  useEffect(() => {
    loadUploads();
  }, [loadUploads]);

  const handleUploadSuccess = useCallback(
    (createdUploads: Upload[]) => {
      if (!createdUploads?.length) return;

      setUploads((prev) => {
        const map = new Map<string, Upload>();
        [...createdUploads, ...prev].forEach((item) => map.set(item.id, item));
        return Array.from(map.values());
      });

      const first = createdUploads[0];
      setSelectedUploadId(first.id);
      notifySuccess("تم رفع الملف بنجاح");
    },
    [notifySuccess],
  );

  const handleSelectUpload = (uploadId: string) => {
    setSelectedUploadId(uploadId);
    setNavigateError(null);
  };

  const handleGoToAnalyze = useCallback(() => {
    if (!selectedUpload) {
      setNavigateError("⚠️ يرجى اختيار ملف قبل الانتقال لصفحة التحليل");
      notifyError("⚠️ قم باختيار ملف أولاً", "حدد ملفًا لكي نأخذه إلى صفحة التحليل");
      return;
    }

    const params = new URLSearchParams();
    params.set("uploadId", selectedUpload.id);
    params.set("project", selectedUpload.projectId ?? NO_PROJECT_VALUE);
    router.push(`/${locale}/user/dashboard/analyze?${params.toString()}`);
  }, [locale, notifyError, selectedUpload, router]);

  const handleGoToComparison = useCallback(() => {
    if (!selectedUpload) {
      setNavigateError("⚠️ يرجى اختيار ملف قبل الانتقال لصفحة المقارنة");
      notifyError("⚠️ قم باختيار ملف", "حدد ملفًا لنقلك إلى صفحة المقارنة");
      return;
    }

    if (!canNavigateToComparison) {
      setNavigateError("⚠️ لا يوجد إصدار آخر لنفس المشروع لإجراء المقارنة");
      notifyError("⚠️ لا يمكن المقارنة", "يجب أن يتوفر إصدار آخر للمشروع نفسه لإجراء مقارنة");
      return;
    }
    const params = new URLSearchParams();
    params.set("project", selectedUpload.projectId ?? NO_PROJECT_VALUE);
    params.set("uploadId", selectedUpload.id);
    router.push(`/${locale}/user/dashboard/comparisons?${params.toString()}`);
  }, [locale, notifyError, router, selectedUpload, canNavigateToComparison]);

  const renderUploadCard = (upload: Upload) => {
    const isActive = upload.id === selectedUploadId;
    return (
      <li key={upload.id} className="list-none">
        <button
          type="button"
          onClick={() => handleSelectUpload(upload.id)}
          className={`w-full text-start rounded-lg border p-4 shadow-sm transition hover:border-primary hover:shadow-md ${
            isActive ? "border-primary bg-primary/5" : "border-muted bg-card"
          }`}
          aria-label={`اختيار الإصدار ${upload.originalFilename}`}
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
      </li>
    );
  };

  const UploadsSkeleton = () => (
    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3" role="list" aria-live="polite">
      {[...Array(4)].map((_, index) => (
        <li
          key={index}
          className="rounded-lg border border-muted bg-card p-4 shadow-sm space-y-3"
          aria-hidden="true"
        >
          <Skeleton variant="title" className="w-3/4" />
          <Skeleton variant="text" className="w-2/3" />
          <Skeleton variant="badge" className="w-16" />
        </li>
      ))}
    </ul>
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">📤 إدارة الرفع</h1>
        <p className="text-sm text-muted-foreground mt-1">
          حدّد المشروع المناسب قبل الرفع، ثم تابع الإصدارات المرتبطة به من نفس الصفحة.
        </p>
      </div>

      <FileUploadWidget onUploadSuccess={handleUploadSuccess} />

      <Card className="bg-muted/30 border border-muted-foreground/20">
        <CardContent className="py-6 space-y-8">
          <section>
            <h2 className="sr-only">خطوات سير التحليل</h2>
            <div className="flex flex-col gap-6 md:flex-row md:items-stretch md:gap-0 md:divide-x md:divide-muted-foreground/20">
              <div className="flex flex-1 items-start gap-3 md:px-5">
                <span className="rounded-full bg-primary/10 p-2 text-primary">
                  <UploadCloud className="h-5 w-5" />
                </span>
                <div className="space-y-1">
                  <p className="font-medium text-foreground">1. رفع الإصدار</p>
                  <p className="text-xs text-muted-foreground">
                    اختر المشروع المناسب ثم ارفع ملف ZIP لبدء خط سير التحليل.
                  </p>
                </div>
              </div>

              <div className="flex flex-1 items-start gap-3 md:px-5">
                <span className="rounded-full bg-blue-500/10 p-2 text-blue-400">
                  <FileSearch className="h-5 w-5" />
                </span>
                <div className="space-y-1">
                  <p className="font-medium text-foreground">2. تحليل سريع</p>
                  <p className="text-xs text-muted-foreground">
                    بعد اكتمال التحليل يمكنك القفز مباشرة لعرض التقرير التفصيلي.
                  </p>
                </div>
              </div>

              <div className="flex flex-1 items-start gap-3 md:px-5">
                <span className="rounded-full bg-emerald-500/10 p-2 text-emerald-400">
                  <GitCompare className="h-5 w-5" />
                </span>
                <div className="space-y-1">
                  <p className="font-medium text-foreground">3. المقارنة بين الإصدارات</p>
                  <p className="text-xs text-muted-foreground">
                    إذا كان للمشروع أكثر من إصدار يمكنك المقارنة لاكتشاف الفروق بسرعة.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <Callout className="space-y-1" variant="default">
            <p className="font-semibold text-foreground">كيف تُكمل سير العمل بعد الرفع؟</p>
            <p>
              اختر الإصدار من القائمة أدناه ثم استخدم الأزرار للانتقال إلى الصفحة المناسبة: التحليل
              يتم في صفحة <span className="font-medium">التحليل</span>، والمقارنة في صفحة
              <span className="font-medium"> المقارنة</span>.
            </p>
          </Callout>

          <section className="space-y-4" aria-live="polite">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">الإصدارات المرتبطة</h2>
              <span className="text-xs text-muted-foreground">{uploads.length} إصدار/ات متاحة</span>
            </div>
            {loadingUploads ? (
              <UploadsSkeleton />
            ) : uploadsError ? (
              <p className="text-sm text-destructive">❌ {uploadsError}</p>
            ) : uploads.length === 0 ? (
              <p className="text-sm text-muted-foreground">⚠️ لا توجد إصدارات ضمن هذا المشروع.</p>
            ) : (
              <ul
                className="grid grid-cols-1 md:grid-cols-2 gap-3"
                role="list"
                aria-label="قائمة الإصدارات المتاحة"
              >
                {uploads.map(renderUploadCard)}
              </ul>
            )}
          </section>

          {selectedUpload && (
            <section
              className="space-y-3 border-t border-muted-foreground/20 pt-6"
              aria-live="polite"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-foreground">تفاصيل الإصدار المحدد</h2>
                <span className="text-xs text-muted-foreground">v{selectedUpload.version}</span>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  <strong className="text-foreground">الملف:</strong>{" "}
                  {selectedUpload.originalFilename}
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
                  {selectedUpload.projectId ?? "—"}
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  onClick={handleGoToAnalyze}
                  className="w-full sm:w-auto flex items-center gap-2"
                >
                  اذهب إلى صفحة التحليل
                </Button>
                {canNavigateToComparison && (
                  <Button
                    variant="outline"
                    onClick={handleGoToComparison}
                    className="w-full sm:w-auto"
                  >
                    الانتقال للمقارنة
                  </Button>
                )}
              </div>
              {navigateError && <p className="text-xs text-destructive">{navigateError}</p>}
            </section>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
