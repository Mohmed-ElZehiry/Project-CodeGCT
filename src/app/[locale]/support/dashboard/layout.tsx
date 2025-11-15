import { withRoleGuard } from "@/lib/auth/withRoleGuard";
import GenericDashboardLayoutClient from "@/shared/components/layout/Dashboard/DashboardShell";
import type { Database } from "@/lib/supabase/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>; // ✅ params بقى Promise
};

export default async function SupportLayout({ children, params }: LayoutProps) {
  const { locale } = await params; // ✅ لازم await

  // ✅ Support فقط
  const profile: Profile = await withRoleGuard("support", locale || "en");

  return (
    <GenericDashboardLayoutClient
      title={locale === "ar" ? "لوحة الدعم" : "Support Dashboard"}
      locale={locale || "en"}
      profile={profile} // ✅ مرر profile كامل
    >
      {children}
    </GenericDashboardLayoutClient>
  );
}
