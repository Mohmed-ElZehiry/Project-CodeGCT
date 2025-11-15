"use client";

import React from "react";
import { Info } from "lucide-react";

const CURRENT_ALLOWED_EXTENSION = ".zip";
const MAX_FILE_SIZE_MB = 100;

export default function UploadInstructions() {
  return (
    <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
      <h3 className="font-medium mb-2 flex items-center gap-2 text-blue-700 dark:text-blue-300">
        <Info className="w-4 h-4" />
        تعليمات الرفع
      </h3>
      <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1 list-disc list-inside">
        <li>
          الرجاء رفع المشروع في ملف مضغوط بصيغة <strong>{CURRENT_ALLOWED_EXTENSION}</strong> فقط؛
          التحليل الحالي لا يدعم صيغ RAR أو 7z بعد.
        </li>
        <li>
          إذا كان مشروعك بصيغة أخرى (مثل RAR)، قم بإعادة ضغطه إلى ZIP قبل الرفع لضمان استخراج
          الملفات وتحليلها بنجاح.
        </li>
        <li>الحد الأقصى لحجم الملف: {MAX_FILE_SIZE_MB} ميجابايت</li>
        <li>تأكد من خلو الملف من الفيروسات والبرمجيات الضارة</li>
      </ul>
    </div>
  );
}
