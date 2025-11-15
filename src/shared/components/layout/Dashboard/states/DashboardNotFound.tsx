"use client";

import { useRouter, useParams } from "next/navigation";

export default function DashboardNotFound() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  const messages = {
    title: isRTL ? "🚫 الصفحة غير موجودة" : "🚫 Page Not Found",
    description: isRTL
      ? "عذراً، الصفحة التي تبحث عنها غير موجودة أو ربما تم نقلها."
      : "Sorry, the page you are looking for does not exist or may have been moved.",
    goBack: isRTL ? "⬅️ العودة للخلف" : "⬅️ Go Back",
    goHome: isRTL ? "🏠 العودة للرئيسية" : "🏠 Go Home",
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 p-6 animate-fadeIn">
      <div className="max-w-md w-full text-center">
        {/* ✅ العنوان */}
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-4">
          {messages.title}
        </h1>

        {/* ✅ الوصف */}
        <p className="text-gray-600 dark:text-gray-400 mb-6">{messages.description}</p>

        {/* ✅ الأزرار */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
          >
            {messages.goBack}
          </button>
          <button
            onClick={() => router.push(`/${locale}`)}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
          >
            {messages.goHome}
          </button>
        </div>
      </div>
    </div>
  );
}
