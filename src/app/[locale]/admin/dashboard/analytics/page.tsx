"use client";

import { useTranslations } from "next-intl";

export default function AnalyticsPage() {
  const t = useTranslations("adminAnalytics");

  return (
    <div className="p-6 space-y-6">
      {/* العنوان */}
      <header className="border-b border-slate-700 pb-3">
        <h1 className="text-2xl font-bold text-blue-400">
          📊 {t("title", { default: "لوحة التحليلات" })}
        </h1>
        <p className="text-slate-400 text-sm">
          {t("subtitle", { default: "نظرة عامة على أداء النظام" })}
        </p>
      </header>

      {/* أقسام التحليلات */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* مثال: عدد المستخدمين */}
        <div className="p-4 rounded-lg bg-slate-900 border border-slate-700 shadow">
          <h2 className="text-lg font-semibold text-green-400">
            👥 {t("users", { default: "المستخدمين" })}
          </h2>
          <p className="text-3xl font-bold text-slate-200">1,245</p>
          <p className="text-slate-400 text-sm">
            +12% {t("sinceLastMonth", { default: "منذ الشهر الماضي" })}
          </p>
        </div>

        {/* مثال: عدد التقارير */}
        <div className="p-4 rounded-lg bg-slate-900 border border-slate-700 shadow">
          <h2 className="text-lg font-semibold text-yellow-400">
            📑 {t("reports", { default: "التقارير" })}
          </h2>
          <p className="text-3xl font-bold text-slate-200">320</p>
          <p className="text-slate-400 text-sm">
            +5% {t("sinceLastWeek", { default: "منذ الأسبوع الماضي" })}
          </p>
        </div>

        {/* مثال: متوسط وقت التنفيذ */}
        <div className="p-4 rounded-lg bg-slate-900 border border-slate-700 shadow">
          <h2 className="text-lg font-semibold text-purple-400">
            ⚡ {t("executionTime", { default: "متوسط وقت التنفيذ" })}
          </h2>
          <p className="text-3xl font-bold text-slate-200">2.3s</p>
          <p className="text-slate-400 text-sm">
            -8% {t("sinceLastRun", { default: "منذ آخر تشغيل" })}
          </p>
        </div>
      </section>

      {/* Placeholder لمخططات مستقبلية */}
      <section className="p-4 rounded-lg bg-slate-900 border border-slate-700 shadow">
        <h2 className="text-lg font-semibold text-blue-300">
          📈 {t("charts", { default: "المخططات" })}
        </h2>
        <div className="h-64 flex items-center justify-center text-slate-500">
          {t("chartsPlaceholder", { default: "سيتم إضافة الرسوم البيانية هنا" })}
        </div>
      </section>
    </div>
  );
}
