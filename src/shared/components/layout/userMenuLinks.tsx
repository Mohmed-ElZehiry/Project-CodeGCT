// D:\Works\Projects\Project_Delta\delta\src\shared\components\layout\userMenuLinks.tsx

export type UserMenuLink = {
  href: string;
  label: string;
};

export type Role = "user" | "support" | "admin"; // ✅ typing أدق
export type RoleLinks = Record<Role, UserMenuLink[]>;

/**
 * ✅ دالة ترجع روابط القائمة العامة وروابط حسب الدور
 * @param locale اللغة الحالية (en / ar / ur ...)
 * @param isRTL هل اللغة من اليمين لليسار
 */
export const getUserMenuLinks = (locale: string, isRTL: boolean) => {
  // ✅ تأمين قيمة الـ locale
  const safeLocale = ["en", "ar", "ur"].includes(locale) ? locale : "en";

  // روابط عامة متاحة للجميع
  const publicLinks: UserMenuLink[] = [
    { href: `/${safeLocale}/report`, label: isRTL ? "التقارير" : "Reports" },
    { href: `/${safeLocale}/support`, label: isRTL ? "الدعم الفني" : "Support" },
    { href: `/${safeLocale}/privacy`, label: isRTL ? "سياسة الخصوصية" : "Privacy" },
    { href: `/${safeLocale}/about`, label: isRTL ? "معلومات عنا" : "About" },
  ];

  // روابط حسب الدور
  const roleLinks: RoleLinks = {
    user: [
      { href: `/${safeLocale}/user/dashboard`, label: isRTL ? "لوحة التحكم" : "Dashboard" },
      { href: `/${safeLocale}/user/profile`, label: isRTL ? "الملف الشخصي" : "Profile" }, // ✅ إضافة
    ],
    support: [
      {
        href: `/${safeLocale}/support/dashboard`,
        label: isRTL ? "لوحة الدعم" : "Support Dashboard",
      },
      { href: `/${safeLocale}/support/tickets`, label: isRTL ? "التذاكر" : "Tickets" },
      { href: `/${safeLocale}/support/profile`, label: isRTL ? "الملف الشخصي" : "Profile" }, // ✅ إضافة
    ],
    admin: [
      { href: `/${safeLocale}/admin/dashboard`, label: isRTL ? "لوحة الإدارة" : "Admin Dashboard" },
      { href: `/${safeLocale}/admin/users`, label: isRTL ? "المستخدمون" : "Users" },
      { href: `/${safeLocale}/admin/settings`, label: isRTL ? "الإعدادات" : "Settings" },
      { href: `/${safeLocale}/admin/logs`, label: isRTL ? "السجلات" : "Logs" },
      { href: `/${safeLocale}/admin/profile`, label: isRTL ? "الملف الشخصي" : "Profile" }, // ✅ إضافة
    ],
  };

  return { publicLinks, roleLinks };
};
