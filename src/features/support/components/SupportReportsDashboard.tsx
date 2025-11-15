"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { logError, logInfo } from "@/lib/utils/logger";
import SupportStats from "./SupportStats";
import SupportReportsTable from "./SupportReportsTable";
import SupportReportDetails from "./SupportReportsDetails";
import type { SupportReport } from "../types/support";
import {
  useCreateSupportReportMutation,
  useSupportReportsQuery,
  useUpdateSupportReportMutation,
} from "../hooks/queries/supportReportsQueries";

const PRIORITIES: SupportReport["priority"][] = ["low", "medium", "high", "critical"];
const STATUSES: SupportReport["status"][] = ["open", "in_progress", "resolved", "closed"];

export default function SupportReportsDashboard() {
  const { data: reports, isLoading: listLoading } = useSupportReportsQuery();
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [reportToEdit, setReportToEdit] = useState<SupportReport | null>(null);

  useEffect(() => {
    if (!reports || reports.length === 0) {
      setSelectedReportId(null);
      return;
    }

    if (!selectedReportId) {
      setSelectedReportId(reports[0].id);
      return;
    }

    const exists = reports.some((report) => report.id === selectedReportId);
    if (!exists) {
      setSelectedReportId(reports[0].id);
    }
  }, [reports, selectedReportId]);

  const handleCreated = (report: SupportReport) => {
    logInfo("support: report created", {
      reportId: report.id,
      priority: report.priority,
    });
    setSelectedReportId(report.id);
    setIsCreateOpen(false);
  };

  const handleUpdated = (report: SupportReport) => {
    logInfo("support: report updated", {
      reportId: report.id,
      status: report.status,
    });
    setSelectedReportId(report.id);
    setReportToEdit(null);
  };

  const handleCancelForms = () => {
    setIsCreateOpen(false);
    setReportToEdit(null);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col items-start justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/40 p-5 shadow-sm shadow-slate-900/20 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">لوحة البلاغات</h1>
          <p className="mt-1 text-sm text-slate-400">
            إدارة بلاغات الدعم، التحديث، إضافة التعليقات والمرفقات في مكان واحد.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setIsCreateOpen((prev) => !prev)}
            className="rounded-md border border-emerald-500/40 bg-emerald-500/20 px-3 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-500/30"
          >
            {isCreateOpen ? "إخفاء نموذج الإنشاء" : "➕ بلاغ جديد"}
          </button>
          {reportToEdit && (
            <button
              type="button"
              onClick={() => setReportToEdit(null)}
              className="rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
            >
              إلغاء التعديل
            </button>
          )}
        </div>
      </header>

      {isCreateOpen && (
        <ReportForm mode="create" onSuccess={handleCreated} onCancel={handleCancelForms} />
      )}

      {reportToEdit && (
        <ReportForm
          mode="edit"
          reportId={reportToEdit.id}
          defaultValues={reportToEdit}
          onSuccess={handleUpdated}
          onCancel={handleCancelForms}
        />
      )}

      <SupportStats />

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          {listLoading && <p className="text-slate-400">⏳ تحميل قائمة البلاغات...</p>}
          <SupportReportsTable
            selectedId={selectedReportId}
            onSelect={(report) => setSelectedReportId(report.id)}
          />
        </div>
        <div className="min-h-[320px]">
          <SupportReportDetails
            reportId={selectedReportId}
            onEdit={(report) => setReportToEdit(report)}
          />
        </div>
      </section>
    </div>
  );
}

type ReportFormProps = {
  mode: "create" | "edit";
  reportId?: string;
  defaultValues?: Partial<SupportReport>;
  onSuccess?: (report: SupportReport) => void;
  onCancel?: () => void;
};

function ReportForm({ mode, reportId, defaultValues, onSuccess, onCancel }: ReportFormProps) {
  const [title, setTitle] = useState(defaultValues?.title ?? "");
  const [description, setDescription] = useState(defaultValues?.description ?? "");
  const [priority, setPriority] = useState<SupportReport["priority"]>(
    defaultValues?.priority ?? "medium",
  );
  const [status, setStatus] = useState<SupportReport["status"]>(defaultValues?.status ?? "open");

  useEffect(() => {
    setTitle(defaultValues?.title ?? "");
    setDescription(defaultValues?.description ?? "");
    setPriority(defaultValues?.priority ?? "medium");
    setStatus(defaultValues?.status ?? "open");
  }, [defaultValues]);

  const createMutation = useCreateSupportReportMutation();
  const updateMutation = useUpdateSupportReportMutation(reportId);

  const isSubmitting = mode === "create" ? createMutation.isPending : updateMutation.isPending;
  const mutationError = mode === "create" ? createMutation.error : updateMutation.error;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      ...(mode === "edit" ? { status } : {}),
    };

    if (!payload.title) return;

    try {
      if (mode === "create") {
        const created = await createMutation.mutateAsync(payload);
        onSuccess?.(created);
      } else if (reportId) {
        const updated = await updateMutation.mutateAsync(payload);
        onSuccess?.(updated);
      }
    } catch (err) {
      logError("support: report form submission failed", {
        mode,
        reportId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const heading = mode === "create" ? "إنشاء بلاغ جديد" : "تحديث البلاغ";

  return (
    <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/40 p-5 shadow-sm shadow-slate-900/20">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-100">{heading}</h2>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-slate-700 px-3 py-1 text-sm text-slate-300 transition hover:bg-slate-800"
        >
          إغلاق
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm text-slate-300" htmlFor={`title-${mode}`}>
            عنوان البلاغ
          </label>
          <input
            id={`title-${mode}`}
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            className="w-full rounded-md border border-slate-700 bg-slate-900/60 p-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none"
            placeholder="وصف مختصر للمشكلة"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-slate-300" htmlFor={`description-${mode}`}>
            التفاصيل (اختياري)
          </label>
          <textarea
            id={`description-${mode}`}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
            className="w-full rounded-md border border-slate-700 bg-slate-900/60 p-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none"
            placeholder="أدخل التفاصيل والسياق الكامل للبلاغ"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm text-slate-300" htmlFor={`priority-${mode}`}>
              الأولوية
            </label>
            <select
              id={`priority-${mode}`}
              value={priority}
              onChange={(event) => setPriority(event.target.value as SupportReport["priority"])}
              className="w-full rounded-md border border-slate-700 bg-slate-900/60 p-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none"
            >
              {PRIORITIES.map((value) => (
                <option key={value} value={value}>
                  {translatePriority(value)}
                </option>
              ))}
            </select>
          </div>

          {mode === "edit" && (
            <div className="space-y-2">
              <label className="text-sm text-slate-300" htmlFor={`status-${mode}`}>
                الحالة
              </label>
              <select
                id={`status-${mode}`}
                value={status}
                onChange={(event) => setStatus(event.target.value as SupportReport["status"])}
                className="w-full rounded-md border border-slate-700 bg-slate-900/60 p-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none"
              >
                {STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {translateStatus(value)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md border border-blue-500/40 bg-blue-500/20 px-4 py-2 text-sm font-medium text-blue-100 transition hover:bg-blue-500/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "جاري الحفظ..." : mode === "create" ? "إنشاء" : "تحديث"}
          </button>
          {mutationError && (
            <span className="text-xs text-red-400">❌ {mutationError.message}</span>
          )}
        </div>
      </form>
    </section>
  );
}

function translatePriority(priority: SupportReport["priority"]) {
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

function translateStatus(status: SupportReport["status"]) {
  switch (status) {
    case "open":
      return "مفتوح";
    case "in_progress":
      return "قيد المعالجة";
    case "resolved":
      return "محلول";
    case "closed":
      return "مغلق";
    default:
      return status;
  }
}
