import {
  HomeIcon,
  UserIcon,
  Cog6ToothIcon,
  LifebuoyIcon,
  ShieldCheckIcon,
  ArchiveBoxIcon,
  Squares2X2Icon,
  DocumentTextIcon,
  DocumentArrowDownIcon,
  ClipboardDocumentListIcon,
  ArrowUpTrayIcon, // أيقونة للرفع
} from "@heroicons/react/24/outline";
import type { Database } from "@/lib/supabase/database.types";

export type Role = Database["public"]["Enums"]["user_role"];

export type NavLink = {
  href: (locale: string) => string;
  label: (locale: string) => string;
  icon?: React.ComponentType<{ className?: string }>;
  roles?: Role[];
  /** دالة للتحقق من الـ active بشكل صارم */
  activeMatch?: (pathname: string, locale: string) => boolean;
};

export type NavigationConfig = Record<Role, NavLink[]>;

export const publicLinks: NavLink[] = [
  {
    href: (locale) => `/${locale}/privacy`,
    label: (locale) => (locale === "ar" ? "سياسة الخصوصية" : "Privacy Policy"),
    activeMatch: (pathname, locale) => pathname === `/${locale}/privacy`,
  },
  {
    href: (locale) => `/${locale}/about`,
    label: (locale) => (locale === "ar" ? "معلومات عنا" : "About Us"),
    activeMatch: (pathname, locale) => pathname === `/${locale}/about`,
  },
];

export const navigation: NavigationConfig = {
  user: [
    {
      href: (locale) => `/${locale}/user/dashboard`,
      label: (locale) => (locale === "ar" ? "لوحة التحكم" : "Dashboard"),
      icon: HomeIcon,
      roles: ["user"],
      activeMatch: (pathname, locale) => pathname === `/${locale}/user/dashboard`,
    },
    {
      href: (locale) => `/${locale}/user/dashboard/uploads`,
      label: (locale) => (locale === "ar" ? "إدارة الملفات" : "Uploads"),
      icon: ArrowUpTrayIcon,
      roles: ["user"],
      activeMatch: (pathname, locale) =>
        pathname === `/${locale}/user/dashboard/uploads` ||
        pathname.startsWith(`/${locale}/user/dashboard/uploads/`),
    },
    {
      href: (locale) => `/${locale}/user/dashboard/analyze`,
      label: (locale) => (locale === "ar" ? "تحليل الملفات" : "Analyze"),
      icon: DocumentArrowDownIcon,
      roles: ["user"],
      activeMatch: (pathname, locale) =>
        pathname === `/${locale}/user/dashboard/analyze` ||
        pathname.startsWith(`/${locale}/user/dashboard/analyze/`),
    },

    {
      href: (locale) => `/${locale}/user/dashboard/comparisons`,
      label: (locale) => (locale === "ar" ? "مقارنة النسخ" : "Comparisons"),
      icon: Squares2X2Icon,
      roles: ["user"],
      activeMatch: (pathname, locale) =>
        pathname === `/${locale}/user/dashboard/comparisons` ||
        pathname.startsWith(`/${locale}/user/dashboard/comparisons/`),
    },
    {
      href: (locale) => `/${locale}/user/dashboard/reports`,
      label: (locale) => (locale === "ar" ? "التقارير" : "Reports"),
      icon: DocumentTextIcon,
      roles: ["user"],
      activeMatch: (pathname, locale) =>
        pathname === `/${locale}/user/dashboard/reports` ||
        pathname.startsWith(`/${locale}/user/dashboard/reports/`),
    },
    {
      href: (locale) => `/${locale}/user/dashboard/archive`,
      label: (locale) => (locale === "ar" ? "الأرشيف" : "Archive"),
      icon: ArchiveBoxIcon,
      roles: ["user"],
      activeMatch: (pathname, locale) =>
        pathname === `/${locale}/user/dashboard/archive` ||
        pathname.startsWith(`/${locale}/user/dashboard/archive/`),
    },
  ],

  support: [
    {
      href: (locale) => `/${locale}/support/dashboard`,
      label: (locale) => (locale === "ar" ? "لوحة الدعم" : "Support Dashboard"),
      icon: HomeIcon,
      roles: ["support"],
      activeMatch: (pathname, locale) => pathname === `/${locale}/support/dashboard`,
    },
    {
      href: (locale) => `/${locale}/support/dashboard/support_reports`,
      label: (locale) => (locale === "ar" ? "بلاغات الدعم" : "Support Reports"),
      icon: LifebuoyIcon,
      roles: ["support"],
      activeMatch: (pathname, locale) =>
        pathname === `/${locale}/support/dashboard/support_reports` ||
        pathname.startsWith(`/${locale}/support/dashboard/support_reports/`),
    },
    {
      href: (locale) => `/${locale}/support/dashboard/stats`,
      label: (locale) => (locale === "ar" ? "إحصائيات الدعم" : "Support Stats"),
      icon: Cog6ToothIcon,
      roles: ["support"],
      activeMatch: (pathname, locale) => pathname === `/${locale}/support/dashboard/stats`,
    },
  ],

  admin: [
    {
      href: (locale) => `/${locale}/admin/dashboard`,
      label: (locale) => (locale === "ar" ? "لوحة الإدارة" : "Admin Dashboard"),
      icon: HomeIcon,
      roles: ["admin"],
      activeMatch: (pathname, locale) => pathname === `/${locale}/admin/dashboard`,
    },
    {
      href: (locale) => `/${locale}/admin/dashboard/user-management`,
      label: (locale) => (locale === "ar" ? "إدارة المستخدمين" : "Manage Users"),
      icon: UserIcon,
      roles: ["admin"],
      activeMatch: (pathname, locale) =>
        pathname === `/${locale}/admin/dashboard/user-management` ||
        pathname.startsWith(`/${locale}/admin/dashboard/user-management`),
    },
    {
      href: (locale) => `/${locale}/admin/dashboard/system_settings`,
      label: (locale) => (locale === "ar" ? "إعدادات النظام" : "System Settings"),
      icon: Cog6ToothIcon,
      roles: ["admin"],
      activeMatch: (pathname, locale) =>
        pathname === `/${locale}/admin/dashboard/system_settings` ||
        pathname.startsWith(`/${locale}/admin/dashboard/system_settings/`),
    },
    {
      href: (locale) => `/${locale}/admin/dashboard/logs`,
      label: (locale) => (locale === "ar" ? "سجلات النظام" : "Audit Logs"),
      icon: ClipboardDocumentListIcon,
      roles: ["admin"],
      activeMatch: (pathname, locale) =>
        pathname === `/${locale}/admin/dashboard/logs` ||
        pathname.startsWith(`/${locale}/admin/dashboard/logs/`),
    },
    {
      href: (locale) => `/${locale}/admin/dashboard/analytics`,
      label: (locale) => (locale === "ar" ? "تحليلات" : "Analytics"),
      icon: Squares2X2Icon,
      roles: ["admin"],
      activeMatch: (pathname, locale) =>
        pathname === `/${locale}/admin/dashboard/analytics` ||
        pathname.startsWith(`/${locale}/admin/dashboard/analytics/`),
    },
  ],
};
