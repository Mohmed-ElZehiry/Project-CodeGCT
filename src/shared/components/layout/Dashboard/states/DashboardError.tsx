"use client";

import { ReactNode } from "react";
import { useRouter, useParams } from "next/navigation";

type DashboardErrorProps = {
  error?: Error;
  reset?: () => void;
  children?: ReactNode;
};

export default function DashboardError({ error, reset, children }: DashboardErrorProps) {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  const messages = {
    title: isRTL ? "⚠️ حدث خطأ ما" : "⚠️ Something went wrong",
    description:
      error?.message ||
      (isRTL
        ? "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى."
        : "An unexpected error occurred. Please try again."),
    tryAgain: isRTL ? "🔄 إعادة المحاولة" : "🔄 Try Again",
    goHome: isRTL ? "🏠 العودة للرئيسية" : "🏠 Go Home",
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 p-6 animate-fadeIn">
      <div className="max-w-md w-full text-center">
        {/* ✅ العنوان */}
        <h1 className="text-2xl font-bold text-red-600 mb-4">{messages.title}</h1>

        {/* ✅ الوصف */}
        <p className="text-gray-600 dark:text-gray-300 mb-6">{messages.description}</p>

        {/* ✅ الأزرار */}
        <div className="flex gap-4 justify-center">
          {reset && (
            <button
              onClick={reset}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
            >
              {messages.tryAgain}
            </button>
          )}
          <button
            onClick={() => router.push(`/${locale}`)}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
          >
            {messages.goHome}
          </button>
        </div>

        {/* ✅ محتوى إضافي (stack trace أو تفاصيل الخطأ) */}
        {children && (
          <div className="mt-6 p-4 border rounded-md bg-white dark:bg-gray-900 shadow-sm text-left">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
