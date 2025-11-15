"use client";

import React from "react";
import { useUploads } from "@/features/user/hooks/useUploads";
import { FileText } from "lucide-react";
import { getStatusStyles } from "@/features/user/utils/styles/getStatusStyles";
import { Upload } from "@/features/user/types/user";
import ErrorAlert from "@/features/user/components/common/ErrorAlert";

type Props = {
  userId: string;
  onSelectUpload?: (id: string) => void;
};

export default function UploadsList({ userId, onSelectUpload }: Props) {
  const { uploads, loading, error } = useUploads(userId);

  if (loading) {
    return <p className="text-sm text-muted-foreground">⏳ جاري تحميل الملفات...</p>;
  }

  if (error) {
    return <ErrorAlert title="حدث خطأ">{error}</ErrorAlert>;
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      <h2 className="text-xl font-bold flex items-center gap-2">📂 قائمة الملفات المرفوعة</h2>

      {uploads.length === 0 ? (
        <div className="p-4 bg-muted rounded-lg text-muted-foreground text-sm flex items-center gap-2">
          ⚠️ لا توجد ملفات مرفوعة بعد
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {uploads.map((upload: Upload) => {
            const styles = getStatusStyles(upload.status);
            return (
              <li
                key={upload.id}
                className="p-4 rounded-lg shadow-md border bg-card cursor-pointer transition hover:scale-[1.02]"
                onClick={() => onSelectUpload && onSelectUpload(upload.id)}
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
                {upload.version && (
                  <span className="text-xs text-muted-foreground block mb-1">
                    🔢 الإصدار: v{upload.version}
                  </span>
                )}
                {upload.checksum && (
                  <span className="text-xs text-muted-foreground block mb-1">
                    🧾 Checksum: {upload.checksum.slice(0, 8)}...
                  </span>
                )}
                {upload.githubUrl && (
                  <a
                    href={upload.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    🔗 تحميل الملف
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
