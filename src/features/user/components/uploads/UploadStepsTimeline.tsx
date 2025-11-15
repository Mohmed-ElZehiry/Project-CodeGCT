"use client";

import React from "react";
import { useUploadSteps } from "@/features/user/hooks/useUploadSteps";
import type { UploadStep } from "@/features/user/types/user";
import { getStepStyles } from "@/features/user/utils/styles/getStepStyles";

type Props = {
  uploadId: string;
};

export default function UploadStepsTimeline({ uploadId }: Props) {
  const { steps, loading, error } = useUploadSteps(uploadId);

  if (loading) {
    return <p className="text-sm text-muted-foreground">⏳ جاري تحميل الخطوات...</p>;
  }

  if (error) {
    return (
      <p className="text-sm text-destructive">❌ حدث خطأ أثناء تحميل الخطوات: {String(error)}</p>
    );
  }

  if (!steps || steps.length === 0) {
    return <p className="text-sm text-muted-foreground">⚠️ لا توجد خطوات مسجلة بعد</p>;
  }

  return (
    <div className="bg-card rounded-xl shadow-md p-6 animate-fadeIn">
      <h2 className="text-lg font-bold mb-4 text-foreground">📑 خطوات التنفيذ</h2>
      <ul className="space-y-4">
        {steps.map((step: UploadStep) => {
          const styles = getStepStyles(step.outcome);
          return (
            <li
              key={step.id}
              className="flex flex-col border-b border-border last:border-none pb-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span>{styles.icon}</span>
                  <span className="font-medium capitalize text-foreground">{step.step}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(step.createdAt).toLocaleDateString()}{" "}
                    {new Date(step.createdAt).toLocaleTimeString()}
                  </span>
                  {step.durationMs && (
                    <span className="text-xs text-info ml-2">
                      ⏱ {Math.round(step.durationMs / 1000)}s
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-lg ${styles.bg} ${styles.text}`}>
                    {styles.icon} {step.outcome}
                  </span>
                  {step.actor && <span className="text-xs text-primary">👤 {step.actor}</span>}
                  {step.link && (
                    <a
                      href={step.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-info hover:underline"
                    >
                      🔗 تفاصيل
                    </a>
                  )}
                </div>
              </div>
              {step.details && (
                <p className="mt-2 text-xs text-muted-foreground">
                  📌{" "}
                  {typeof step.details === "string" ? step.details : JSON.stringify(step.details)}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
