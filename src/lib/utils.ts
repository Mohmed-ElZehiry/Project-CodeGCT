import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import path from "path";

// ✅ cn = clsx + tailwind-merge
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ✅ تنسيق التاريخ
export function formatDate(date: string | Date, locale = "en") {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

// ✅ تقصير النصوص
export function truncate(text: string, maxLength = 50) {
  return text.length > maxLength ? text.slice(0, maxLength) + "…" : text;
}

// ✅ توليد ID
export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

// ✅ Capitalize
export function capitalize(str: string) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ✅ Debounce
export function debounce<T extends (...args: any[]) => void>(func: T, wait: number) {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// ✅ Sleep
export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ✅ Helpers للملفات
export const BACKUPS_DIR = path.resolve(process.cwd(), "backups");
export const REPORTS_DIR = path.resolve(process.cwd(), "reports");

export function safeJson<T = any>(str?: string): T | null {
  if (!str) return null;
  try {
    return JSON.parse(str) as T;
  } catch {
    return null;
  }
}
