"use client";

import React, { useCallback } from "react";
import WidgetContainer from "@/shared/components/layout/Dashboard/WidgetContainer";
import { useUploads } from "@/features/user/hooks/useUploads";
import { Upload } from "@/features/user/types/user";
import { useAuth } from "@/shared/hooks/useAuth";
import ErrorAlert from "@/features/user/components/common/ErrorAlert";
import { FileText } from "lucide-react";
import { getStatusStyles } from "@/features/user/utils/styles/getStatusStyles";

interface UserUploadsPanelProps {
  title?: string;
  description?: string;
  userId?: string;
  onSelectUpload?: (upload: Upload) => void;
  compact?: boolean;
}

export default function UserUploadsPanel({
  title = "📂 الملفات المرفوعة",
  description = "اختر ملفًا للعمل عليه",
  userId,
  onSelectUpload,
  compact = false,
}: UserUploadsPanelProps) {
  const { userId: authUserId } = useAuth();
  const effectiveUserId = userId ?? authUserId;
  const { uploads, loading, error, refreshUploads } = useUploads(effectiveUserId);

  const handleSelect = useCallback(
    (upload: Upload) => {
      if (onSelectUpload) onSelectUpload(upload);
    },
    [onSelectUpload],
  );

  const body = () => {
    if (!effectiveUserId) {
      return <p className="text-sm text-destructive">⚠️ يجب تسجيل الدخول لعرض الملفات.</p>;
    }

    if (loading) {
      return <p className="text-sm text-muted-foreground">⏳ جاري تحميل الملفات...</p>;
    }

    if (error) {
      return <ErrorAlert title="حدث خطأ">{error}</ErrorAlert>;
    }

    if (!uploads.length) {
      return (
        <div className="p-4 bg-muted rounded-lg text-muted-foreground text-sm flex items-center gap-2">
          ⚠️ لا توجد ملفات مرفوعة بعد
        </div>
      );
    }

    return (
      <ul className={compact ? "space-y-2" : "grid grid-cols-1 md:grid-cols-2 gap-4"}>
        {uploads.map((upload) => {
          const styles = getStatusStyles(upload.status);
          return (
            <li
              key={upload.id}
              className="p-4 rounded-lg shadow-md border bg-card cursor-pointer transition hover:scale-[1.02]"
              onClick={() => handleSelect(upload)}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  {upload.originalFilename}
                </span>
                <span className={`text-xs px-2 py-1 rounded ${styles.bg} ${styles.text}`}>
                  {styles.icon} {upload.status}
                </span>
              </div>
              <span className="text-xs text-muted-foreground block mb-2">
                {new Date(upload.uploadedAt).toLocaleString()}
              </span>
              {upload.projectId && (
                <span className="text-xs text-muted-foreground block mb-1">
                  🗂️ مشروع: {upload.projectId}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <WidgetContainer
      title={title}
      description={description}
      actions={
        <button
          type="button"
          onClick={() => effectiveUserId && refreshUploads(effectiveUserId)}
          className="btn btn-xs bg-primary text-primary-foreground hover:bg-primary/80 disabled:opacity-60"
          disabled={loading}
        >
          🔄 تحديث
        </button>
      }
    >
      {body()}
    </WidgetContainer>
  );
}
