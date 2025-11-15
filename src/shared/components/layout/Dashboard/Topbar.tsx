"use client";

import { useEffect } from "react";
import { Bars3Icon } from "@heroicons/react/24/outline";
import ThemeSwitcher from "../theme-switcher";
import LanguageSwitcher from "../LanguageSwitcher";
import UserMenu from "../UserMenu";
import { ACCENT } from "./constants";
import { cn } from "@/lib/utils";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/shared/hooks/useAuth";

type TopbarProps = {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
};

export default function Topbar({ sidebarOpen, setSidebarOpen }: TopbarProps) {
  const { role, isAuthenticated, user } = useAuth();
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();

  // ✅ fallback للـ locale
  let locale = params?.locale as string;
  if (!locale) {
    const firstSegment = pathname.split("/")[1];
    locale = ["en", "ar"].includes(firstSegment) ? firstSegment : "en";
  }

  const roleAccent = ACCENT[role] ?? ACCENT.user;
  const isRTL = locale === "ar";

  // Create a unique key based on auth state to force re-render
  const authKey = user?.id || "guest";

  return (
    <header
      className={cn(
        "bg-white dark:bg-gray-900 shadow-sm",
        roleAccent?.border ?? "border-b border-gray-200 dark:border-gray-800",
        roleAccent?.ring || "ring-blue-500",
      )}
    >
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        {/* ✅ زر فتح/إغلاق الـ Sidebar (موبايل) */}
        <button
          type="button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden p-1.5 rounded-md text-gray-500 hover:text-gray-700 
                     dark:text-gray-400 dark:hover:text-gray-200 
                     hover:bg-gray-100 dark:hover:bg-gray-800 
                     transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          aria-controls="sidebar"
          aria-expanded={sidebarOpen}
          aria-haspopup="dialog"
        >
          <Bars3Icon className="h-6 w-6" aria-hidden="true" />
        </button>

        {/* ✅ القسم الأيمن: أدوات + UserMenu أو Sign In */}
        <div className="flex items-center gap-4 ml-auto">
          <ThemeSwitcher />
          <LanguageSwitcher />
          <div key={`topbar-auth-${authKey}`}>
            {isAuthenticated ? (
              <UserMenu key={`topbar-user-menu-${authKey}`} showLabel={false} locale={locale} />
            ) : (
              <a
                href={`/${locale}/sign-in`}
                className="px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors whitespace-nowrap"
              >
                {isRTL ? "تسجيل الدخول" : "Sign In"}
              </a>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
