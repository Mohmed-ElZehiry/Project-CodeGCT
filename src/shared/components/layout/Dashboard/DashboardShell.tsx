"use client";

import DashboardLayout from "./DashboardLayout";
import DashboardLoading from "./states/DashboardLoading";
import DashboardError from "./states/DashboardError";
import DashboardNotFound from "./states/DashboardNotFound";
import type { Database } from "@/lib/supabase/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

type DashboardShellProps = {
  children: React.ReactNode;
  title?: string;
  locale: string;
  profile?: Profile | null;
  version?: string;
  error?: Error | null;
  isLoading?: boolean;
};

function getDashboardTitle(role: string, locale: string, title?: string) {
  if (title) return title;
  const isArabic = locale === "ar";
  switch (role) {
    case "admin":
      return isArabic ? "لوحة المشرف" : "Admin Dashboard";
    case "support":
      return isArabic ? "لوحة الدعم" : "Support Dashboard";
    default:
      return isArabic ? "لوحة التحكم" : "User Dashboard";
  }
}

export default function DashboardShell({
  children,
  title,
  locale,
  profile,
  version = "1.0.0",
  error,
  isLoading = false,
}: DashboardShellProps) {
  if (isLoading) return <DashboardLoading />;
  if (error) return <DashboardError error={error} />;
  if (!profile) return <DashboardNotFound />;

  const resolvedTitle = getDashboardTitle(profile.role, locale, title);

  return (
    <DashboardLayout profile={profile} version={version}>
      <div className="mb-6 animate-fadeIn">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
          {resolvedTitle}
        </h1>
      </div>
      {children}
    </DashboardLayout>
  );
}
