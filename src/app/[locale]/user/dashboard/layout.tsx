import { withRoleGuard } from "@/lib/auth/withRoleGuard";
import GenericDashboardLayoutClient from "@/shared/components/layout/Dashboard/DashboardShell";
import type { Database } from "@/lib/supabase/database.types";
import { NotificationProvider } from "@/features/user/context/NotificationContext";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function Layout({ children, params }: LayoutProps) {
  const { locale } = await params;

  const profile: Profile = await withRoleGuard("user", locale || "en");

  return (
    <GenericDashboardLayoutClient locale={locale || "en"} profile={profile}>
      {/* 🟢 نضيف الـ NotificationProvider هنا */}
      <NotificationProvider>{children}</NotificationProvider>
    </GenericDashboardLayoutClient>
  );
}
