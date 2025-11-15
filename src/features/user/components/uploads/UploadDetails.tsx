"use client";

import React from "react";
import UploadStepsTimeline from "./UploadStepsTimeline";
import { getStatusStyles } from "@/features/user/utils/styles/getStatusStyles";
import { Info, AlertTriangle } from "lucide-react";
import { Upload } from "@/features/user/types/user";

type Props = {
  upload: Upload;
};

export default function UploadDetails({ upload }: Props) {
  const statusStyle = getStatusStyles(upload.status);

  return (
    <div className="bg-card rounded-xl shadow-glass p-6 animate-fadeIn">
      <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-foreground">
        <Info className="w-5 h-5 text-primary" /> 📑 تفاصيل الملف
      </h2>

      <ul className="text-sm space-y-3 text-muted-foreground">
        <li>
          <strong className="text-foreground">📄 الاسم:</strong> {upload.originalFilename}
        </li>
        <li>
          <strong className="text-foreground">⚙️ الحالة:</strong>{" "}
          <span
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}
          >
            {statusStyle.icon} {upload.status}
          </span>
          {upload.errorMessage && (
            <span className="ml-2 inline-flex items-center text-red-600 text-xs">
              <AlertTriangle className="w-4 h-4 mr-1" /> {upload.errorMessage}
            </span>
          )}
        </li>
        <li>
          <strong className="text-foreground">🔢 الإصدار:</strong> v{upload.version}
        </li>
        <li>
          <strong className="text-foreground">📅 تاريخ الرفع:</strong>{" "}
          {new Date(upload.uploadedAt).toLocaleString()}
        </li>
        {upload.fileSize && (
          <li>
            <strong className="text-foreground">💾 الحجم:</strong>{" "}
            {upload.fileSize < 1024 * 1024
              ? `${(upload.fileSize / 1024).toFixed(2)} KB`
              : `${(upload.fileSize / 1024 / 1024).toFixed(2)} MB`}
          </li>
        )}
        {upload.checksum && (
          <li>
            <strong className="text-foreground">🧾 Checksum:</strong> {upload.checksum.slice(0, 10)}
            ...
          </li>
        )}
        {upload.githubUrl && (
          <li>
            <strong className="text-foreground">🔗 رابط التحميل:</strong>{" "}
            <a
              href={upload.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              تحميل الملف من GitHub
            </a>
          </li>
        )}
      </ul>

      {/* 🟢 عرض الـ Timeline */}
      <div className="mt-6">
        <UploadStepsTimeline uploadId={upload.id} />
      </div>
    </div>
  );
}
