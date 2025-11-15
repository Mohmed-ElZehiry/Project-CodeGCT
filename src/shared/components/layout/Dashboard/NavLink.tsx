"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { ElementType } from "react";
import { usePathname } from "next/navigation";
import type { Role } from "@/config/navigation"; // استيراد الـ Role من ملف navigation

type NavLinkProps = {
  href: string | ((locale: string) => string);
  label: string | ((locale: string) => string);
  icon?: ElementType;
  locale: string;
  role?: string;
  activeClasses?: string;
  inactiveClasses?: string;
  onClick?: () => void;
  active?: boolean; // Add active prop for manual control
};

export default function NavLink({
  href,
  label,
  icon: Icon,
  locale,
  activeClasses,
  inactiveClasses,
  onClick,
  active,
}: NavLinkProps) {
  const pathname = usePathname();

  // ✅ normalize لتجاهل الـ locale في المقارنة
  const normalize = (path: string) => path.replace(/^\/(en|ar)/, "");

  // Handle both string and function href
  const linkHref = typeof href === "function" ? href(locale) : href;
  const normalizedPath = normalize(pathname);
  const normalizedHref = normalize(linkHref);

  // Handle both string and function label
  const linkLabel = typeof label === "function" ? label(locale) : label;

  // Check if active state is controlled by parent or needs to be calculated
  const isActiveState =
    typeof active === "boolean"
      ? active
      : normalizedHref === "" || normalizedHref === "/"
        ? normalizedPath === "" || normalizedPath === "/"
        : normalizedPath === normalizedHref || normalizedPath.startsWith(`${normalizedHref}/`);

  const baseClasses =
    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";

  const fallbackInactiveClasses =
    "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800";

  const resolvedActiveClasses =
    activeClasses ?? "bg-blue-600 text-white dark:bg-blue-500 dark:text-white"; // ممكن تخصصها حسب الدور
  const resolvedInactiveClasses = inactiveClasses ?? fallbackInactiveClasses;

  return (
    <Link
      href={linkHref}
      onClick={onClick}
      aria-current={isActiveState ? "page" : undefined}
      aria-label={linkLabel}
      className={cn(
        baseClasses,
        isActiveState ? resolvedActiveClasses : resolvedInactiveClasses,
        "flex items-center gap-3",
      )}
    >
      {Icon ? (
        <Icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
      ) : (
        <span className="w-5 h-5 flex items-center justify-center" aria-hidden="true">
          •
        </span>
      )}
      <span className="truncate" title={linkLabel}>
        {linkLabel}
      </span>
    </Link>
  );
}
