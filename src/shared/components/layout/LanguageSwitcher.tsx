"use client";

import { useParams, usePathname, useRouter } from "next/navigation";
import { Button } from "@/shared/components/ui/button";
import { useCallback, useMemo, useState, useEffect } from "react";

export default function LanguageSwitcher() {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // ✅ نتأكد إن الكومبوننت اتعمله mount عشان نتجنب hydration mismatch
  useEffect(() => setMounted(true), []);

  // ✅ تحديد اللغة الحالية واللغة التالية
  const { currentLocale, nextLocale } = useMemo(() => {
    const locale = (params?.locale as string) || "en";
    return {
      currentLocale: locale,
      nextLocale: locale === "en" ? "ar" : "en",
    };
  }, [params?.locale]);

  // ✅ التبديل بين اللغات مع الحفاظ على الـ query params
  const switchLocale = useCallback(() => {
    if (!pathname) return;

    // إزالة الـ locale الحالي من بداية المسار
    const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}(\/|$)/, "/");

    // بناء المسار الجديد
    const newPath = `/${nextLocale}${pathWithoutLocale}`;

    // استبدال المسار الحالي بالمسار الجديد
    router.replace(newPath);
  }, [pathname, nextLocale, router]);

  // ✅ لو لسه بيعمل mount نعرض Spinner صغير
  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        aria-label="Loading language switcher"
        className="flex items-center justify-center w-20"
      >
        <div className="w-4 h-4 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={(e) => {
        e.stopPropagation();
        switchLocale();
      }}
      className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
      aria-label={currentLocale === "en" ? "Switch language to Arabic" : "التغيير إلى الإنجليزية"}
    >
      {currentLocale === "en" ? "العربية" : "English"}
    </Button>
  );
}
