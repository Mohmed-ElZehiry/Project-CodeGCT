"use client";

import Link from "next/link";
import { useCallback, useMemo } from "react";
import { SupportStats, useSupportReportsQuery } from "@/features/support";
import { useAuthorize } from "@/shared/hooks/useAuthorize";
import { RefreshButton } from "@/shared/components/ui/refresh-button";

export default function SupportDashboardPage() {
  useAuthorize({ allow: ["support", "admin"], redirect: "/user/dashboard" });

  const { data, isLoading, isError, refetch, isFetching } = useSupportReportsQuery();

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const recentReports = useMemo(() => {
    if (!data) return [];
    return data.slice(0, 5);
  }, [data]);

  const isRefreshing = isFetching;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-100">لوحة الدعم</h1>
          <p className="text-sm text-slate-400">
            نظرة عامة سريعة على أداء فريق الدعم، أحدث البلاغات، وروابط الوصول السريع للمسارات
            المتخصصة.
          </p>
        </div>
        <RefreshButton
          onRefresh={handleRefresh}
          loading={isRefreshing}
          className="self-start sm:self-auto"
        />
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-100">الإحصائيات العامة</h2>
        <SupportStats />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-100">أحدث البلاغات</h2>
            <Link
              href="./support_reports"
              className="text-sm text-blue-300 underline-offset-2 hover:underline"
            >
              عرض جميع البلاغات
            </Link>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            {isLoading && <p className="text-sm text-slate-400">⏳ جارٍ تحميل أحدث البلاغات...</p>}
            {isError && <p className="text-sm text-red-400">❌ تعذّر تحميل قائمة البلاغات.</p>}
            {!isLoading && !isError && recentReports.length === 0 && (
              <p className="text-sm text-slate-400">لا توجد بلاغات جديدة خلال الفترة الأخيرة.</p>
            )}
            {!isLoading && !isError && recentReports.length > 0 && (
              <ul className="space-y-3">
                {recentReports.map((report) => (
                  <li
                    key={report.id}
                    className="rounded-lg border border-slate-800 bg-slate-900/60 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-100">{report.title}</p>
                        {report.description && (
                          <p className="text-xs text-slate-400 line-clamp-2">
                            {report.description}
                          </p>
                        )}
                      </div>
                      <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs capitalize text-blue-200">
                        {report.status.replace("_", " ")}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                      <span>الأولوية: {translatePriority(report.priority)}</span>
                      <span>{new Date(report.createdAt).toLocaleString()}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-100">الوصول السريع</h2>
          <div className="grid grid-cols-1 gap-3">
            <QuickLinkCard
              title="إدارة البلاغات"
              description="إضافة، تحديث، ومتابعة البلاغات مع التعليقات والمرفقات."
              href="./support_reports"
            />
            <QuickLinkCard
              title="إحصائيات الدعم"
              description="عرض المخططات التفصيلية ومؤشرات الأداء الرئيسية لفريق الدعم."
              href="./stats"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function QuickLinkCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-xl border border-slate-800 bg-slate-900/40 p-4 transition hover:border-blue-500/40 hover:bg-slate-900/60"
    >
      <h3 className="text-base font-semibold text-slate-100">{title}</h3>
      <p className="mt-2 text-sm text-slate-400">{description}</p>
      <span className="mt-3 inline-flex items-center text-sm text-blue-300">الانتقال الآن →</span>
    </Link>
  );
}

function translatePriority(priority: "low" | "medium" | "high" | "critical") {
  switch (priority) {
    case "low":
      return "منخفض";
    case "medium":
      return "متوسط";
    case "high":
      return "عالي";
    case "critical":
      return "حرج";
    default:
      return priority;
  }
}
