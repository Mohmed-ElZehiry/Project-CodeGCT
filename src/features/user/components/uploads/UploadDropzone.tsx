"use client";

import React from "react";
import { UploadCloud } from "lucide-react";

type Props = {
  uploading: boolean;
  onSelectFiles: (files: FileList) => void;
};

export default function UploadDropzone({ uploading, onSelectFiles }: Props) {
  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
        uploading
          ? "border-primary/50 bg-primary/5"
          : "border-border hover:border-primary/50 cursor-pointer"
      }`}
      onClick={() => !uploading && document.getElementById("file-upload")?.click()}
    >
      <input
        type="file"
        multiple
        accept=".zip"
        onChange={(e) => e.target.files && onSelectFiles(e.target.files)}
        disabled={uploading}
        className="hidden"
        id="file-upload"
      />

      {uploading ? (
        <div className="space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
          <p className="text-primary font-medium">جاري رفع الملفات...</p>
          <p className="text-sm text-muted-foreground">لا تغلق الصفحة حتى يكتمل الرفع</p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <UploadCloud className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-primary">انقر لرفع ملف</span> أو اسحبه وأسقطه هنا
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              ZIP فقط (الحد الأقصى: 100 ميجابايت)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
