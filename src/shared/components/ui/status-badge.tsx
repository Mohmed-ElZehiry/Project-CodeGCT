"use client";

import { Badge } from "./badge";

export type StatusKind = "active" | "suspended" | "pending" | string;

const STATUS_STYLES: Record<string, string> = {
  active: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
  suspended: "border-rose-500/40 bg-rose-500/10 text-rose-200",
  pending: "border-amber-500/40 bg-amber-500/10 text-amber-200",
};

const STATUS_LABELS: Record<string, string> = {
  active: "نشط",
  suspended: "موقوف",
  pending: "بانتظار التفعيل",
};

export interface StatusBadgeProps {
  status: StatusKind;
  labelMap?: Record<string, string>;
  className?: string;
}

export function StatusBadge({ status, labelMap, className }: StatusBadgeProps) {
  const normalized = String(status).toLowerCase();
  const label = (labelMap ?? STATUS_LABELS)[normalized] ?? String(status);
  const style = STATUS_STYLES[normalized] ?? "border-slate-700 bg-slate-800 text-slate-200";

  return <Badge className={[style, className].filter(Boolean).join(" ")}>{label}</Badge>;
}
