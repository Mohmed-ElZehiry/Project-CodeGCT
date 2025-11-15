"use client";

import { cn } from "@/lib/utils";
import NavLink from "./NavLink";
import { XMarkIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import Image from "next/image";
import { BRAND } from "@/config/brand";
import UserMenu from "../UserMenu";
import { useEffect, useRef } from "react";
import { useParams, usePathname } from "next/navigation";
import { useAuth } from "@/shared/hooks/useAuth";
import { ACCENT } from "./constants";
import { navigation } from "@/config/navigation";

type SidebarProps = {
  open: boolean;
  onClose: () => void;
  basePath: string;
  version: string;
  userMenuVariant?: "inline" | "dropdown";
};

export default function Sidebar({
  open,
  onClose,
  basePath,
  version,
  userMenuVariant = "inline",
}: SidebarProps) {
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const params = useParams();
  const pathname = usePathname();
  const { isAuthenticated, role } = useAuth();

  // ✅ fallback للـ locale
  let locale = params?.locale as string;
  if (!locale) {
    const firstSegment = pathname.split("/")[1];
    locale = ["en", "ar"].includes(firstSegment) ? firstSegment : "en";
  }

  // ✅ accent حسب الدور
  const roleAccent = ACCENT[role] ?? ACCENT.user;

  // ✅ روابط الدور من navigation.ts
  const roleLinks = navigation[role] ?? [];

  // ✅ normalize function لتجاهل الـ locale
  const normalize = (path: string) => path.replace(/^\/(en|ar)/, "");

  // ✅ دالة isActive (أكثر دقة للرولات المختلفة)
  const isActive = (href: string) => {
    const normalizedPath = normalize(pathname);
    const normalizedHref = normalize(href);

    // تحديد المسار الأساسي للداشبورد الحالي بناءً على الدور
    const roleDashboardPath = `/${role}/dashboard`;

    // إذا كان الرابط الحالي هو داشبورد
    if (normalizedHref.endsWith("/dashboard") || normalizedHref.endsWith("/dashboard/")) {
      // نتحقق من أن المسار الحالي هو نفس مسار الداشبورد للرول الحالي
      return (
        normalizedPath === normalize(roleDashboardPath) ||
        normalizedPath === `${normalize(roleDashboardPath)}/`
      );
    }

    // للروابط الأخرى
    return (
      normalizedPath === normalizedHref ||
      (normalizedPath.startsWith(`${normalizedHref}/`) &&
        !normalizedPath.startsWith(`${normalizedHref}//`)) // منع المطابقة الجزئية
    );
  };

  // Manage focus and aria attributes when sidebar opens/closes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };

    if (open) {
      const firstFocusable = document.querySelector<HTMLElement>(
        "#sidebar a[href], #sidebar button",
      );
      firstFocusable?.focus();
      document.addEventListener("keydown", handleKeyDown);
    } else if (menuButtonRef.current) {
      menuButtonRef.current.focus();
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  return (
    <aside
      id="sidebar"
      className={cn(
        "fixed md:static top-0 left-0 h-screen w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-300 ease-in-out z-40 flex flex-col",
        open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
      )}
      aria-label="Sidebar navigation"
      aria-hidden={!open ? "true" : "false"}
      tabIndex={-1}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <Link href={`/${locale}`} className="flex items-center gap-2">
          <div
            className={cn(
              "w-8 h-8 rounded-md flex items-center justify-center",
              roleAccent?.logoBg || "bg-gray-500",
            )}
          >
            <Image
              src="/android-chrome-192x192.png"
              alt={`${BRAND.name} icon`}
              width={24}
              height={24}
              className="rounded"
              priority
            />
          </div>
          <span className="font-bold text-lg text-gray-900 dark:text-white">{BRAND.name}</span>
        </Link>
        <button
          ref={menuButtonRef}
          onClick={onClose}
          className="md:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          aria-label="Close sidebar"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>

      {/* Profile */}
      {isAuthenticated && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <UserMenu variant={userMenuVariant} showLabel={true} locale={locale} />
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {roleLinks.map((link) => {
          const href = link.href(locale);
          return (
            <NavLink
              key={href}
              href={href}
              label={link.label}
              icon={link.icon}
              locale={locale}
              active={isActive(href)}
              activeClasses={roleAccent?.navActive}
              inactiveClasses={roleAccent?.navInactive}
              onClick={() => {
                if (window.innerWidth < 768) {
                  onClose();
                }
              }}
            />
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400">
        <p>v{version}</p>
        <p className="mt-1">
          © {new Date().getFullYear()} {BRAND.name}
        </p>
      </div>
    </aside>
  );
}
