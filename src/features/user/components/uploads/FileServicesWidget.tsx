"use client";

import React from "react";
import WidgetContainer from "@/shared/components/layout/Dashboard/WidgetContainer";
import { FileText, Scale, FileCog, PlayCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface StepCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}

function StepCard({ icon: Icon, title, description, actionLabel, onAction }: StepCardProps) {
  return (
    <div
      className="p-6 rounded-xl bg-card shadow-glass flex flex-col justify-between animate-slideUp hover:shadow-lg transition cursor-pointer overflow-hidden"
      onClick={onAction}
    >
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-6 h-6 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      </div>
      <p className="text-muted-foreground text-sm mb-6">{description}</p>
      <button className="mt-auto px-4 py-2 bg-primary hover:bg-primary/80 text-primary-foreground rounded-lg transition-colors">
        {actionLabel}
      </button>
    </div>
  );
}

export default function FileServicesWidget({
  uploadId,
  projectId,
  userId,
  onAnalysisComplete,
}: {
  uploadId?: string;
  projectId?: string | null;
  userId?: string;
  onAnalysisComplete?: () => void;
}) {
  const router = useRouter();

  if (!uploadId) {
    return (
      <WidgetContainer title="Processing Services" description="الخدمات المتاحة على الملف المرفوع">
        <p className="text-sm text-muted-foreground">⚠️ اختر ملف أولاً لعرض الخدمات المتاحة</p>
      </WidgetContainer>
    );
  }

  const handleRunAnalysis = async () => {
    if (!userId) {
      toast.error("⚠️ تعذّر تحديد المستخدم الحالي");
      return;
    }

    const targetProjectId = projectId ?? "null";
    const locale =
      typeof window !== "undefined" ? window.location.pathname.split("/")[1] || "en" : "en";

    if (!projectId) {
      toast.message?.("سيتم تحليل الملف دون ربط بمشروع محدد");
    }

    try {
      const res = await fetch(`/${locale}/api/user/projects/${targetProjectId}/analyses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          uploadId,
          format: "json",
        }),
      });

      const result = await res.json();
      if (result.success) {
        toast.success("✅ تم تشغيل التحليل وإنشاء تقرير جديد");
        if (onAnalysisComplete) {
          await onAnalysisComplete();
        } else {
          router.push(`/user/dashboard/reports`);
        }
      } else {
        toast.error(result.error || "❌ فشل تشغيل التحليل");
      }
    } catch (err: any) {
      toast.error(err.message || "❌ حدث خطأ أثناء تشغيل التحليل");
    }
  };

  const steps = [
    {
      id: "analysis",
      title: "Analysis",
      description: "تشغيل التحليل على الملف وإنشاء تقرير",
      actionLabel: "ابدأ التحليل",
      icon: PlayCircle,
      onAction: handleRunAnalysis,
    },
    {
      id: "report",
      title: "Report",
      description: "عرض أو تصدير التقرير",
      actionLabel: "انتقال للتقرير",
      icon: FileText,
      onAction: () => router.push(`/user/dashboard/reports`),
    },
    {
      id: "comparison",
      title: "Comparison",
      description: "قارن هذه النسخة مع أخرى",
      actionLabel: "انتقال للمقارنة",
      icon: Scale,
      onAction: () => router.push(`/user/dashboard/comparisons`),
    },
    {
      id: "archive",
      title: "Archive",
      description: "أرشفة الملفات",
      actionLabel: "أرشفة الملفات",
      icon: FileCog,
      onAction: () => router.push(`/user/dashboard/archive`),
    },
  ];

  return (
    <WidgetContainer title="Processing Services" description="الخدمات المتاحة على الملف المرفوع">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {steps.map((step) => (
          <StepCard key={step.id} {...step} />
        ))}
      </div>
    </WidgetContainer>
  );
}
