import { AppProviders } from "@/lib/providers/AppProviders";
import { defaultLocale, isValidLocale } from "@/i18n";
import DashboardLayoutWrapper from "./DashboardLayoutWrapper";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const allowedRoles = ["user", "support", "admin"] as const;
type AppRole = (typeof allowedRoles)[number];

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const resolvedParams = await params;
  const initialLocale = isValidLocale(resolvedParams.locale)
    ? resolvedParams.locale
    : defaultLocale;

  const supabase = await createSupabaseServerClient();

  // ✅ هات الـ user من السيرفر
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let initialRole: AppRole | undefined = "user";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role && allowedRoles.includes(profile.role as AppRole)) {
      initialRole = profile.role as AppRole;
    }
  }

  // ✅ Dynamic import للرسائل
  let messages: Record<string, any>;
  try {
    messages = (await import(`@/i18n/messages/${initialLocale}.json`)).default;
  } catch (error) {
    console.error(`⚠️ Failed to load messages for locale: ${initialLocale}`, error);
    messages = (await import(`@/i18n/messages/${defaultLocale}.json`)).default;
  }

  return (
    <AppProviders
      locale={initialLocale}
      messages={messages}
      initialUser={user ?? null} // ✅ بدل initialSession
      initialRole={initialRole} // ✅ مرر الدور
    >
      <div className="min-h-screen" dir={initialLocale === "ar" ? "rtl" : "ltr"}>
        <DashboardLayoutWrapper>{children}</DashboardLayoutWrapper>
      </div>
    </AppProviders>
  );
}
