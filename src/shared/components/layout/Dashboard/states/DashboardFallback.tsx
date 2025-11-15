"use client";

import React from "react";
import DashboardLoading from "./DashboardLoading";
import DashboardError from "./DashboardError";
import DashboardNotFound from "./DashboardNotFound";

type DashboardFallbackProps = {
  isLoading?: boolean;
  error?: Error | null;
  notFound?: boolean;
  children?: React.ReactNode;
  reset?: () => void;
};

export default function DashboardFallback({
  isLoading = false,
  error = null,
  notFound = false,
  children,
  reset,
}: DashboardFallbackProps) {
  // ✅ حالة التحميل
  if (isLoading) {
    return <DashboardLoading />;
  }

  // ✅ حالة الخطأ
  if (error) {
    return <DashboardError error={error} reset={reset} />;
  }

  // ✅ حالة عدم وجود الصفحة
  if (notFound) {
    return <DashboardNotFound />;
  }

  // ✅ الحالة الطبيعية (عرض المحتوى)
  return <>{children}</>;
}
