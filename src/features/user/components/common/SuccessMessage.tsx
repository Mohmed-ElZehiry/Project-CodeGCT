"use client";

import React from "react";
import { CheckCircle } from "lucide-react";

type Props = {
  files?: File[];
  message?: string;
};

export default function SuccessMessage({ files, message }: Props) {
  return (
    <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg p-4 text-sm animate-fadeIn">
      <div className="flex items-start gap-2">
        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="font-medium text-green-800 dark:text-green-200">
            ✅ {message || "تم التنفيذ بنجاح"}
          </h4>
          {files && files.length > 0 && (
            <div className="mt-2 space-y-1">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300"
                >
                  <span>📄</span>
                  <span className="truncate flex-1">{file.name}</span>
                  <span className="text-xs bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded">
                    {(file.size / (1024 * 1024)).toFixed(1)} ميجابايت
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
