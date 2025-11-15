"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import UserAvatar from "@/shared/components/ui/UserAvatar";
import SignOutButton from "./SignOutButton";
import { X } from "lucide-react";
import UserMenuHeader from "./UserMenuHeader";
import { getUserMenuLinks, type Role } from "./userMenuLinks"; // ✅ استخدام الدالة الموحدة
import { ACCENT } from "./Dashboard/constants";

type UserMenuDropdownProps = {
  userData: {
    displayName: string;
    avatarLetter: string;
    avatarUrl: string | null;
    roleLabel: string;
    email: string;
  };
  showLabel: boolean;
  locale: string;
  role: Role | string; // Allow string for backward compatibility
  isAuthenticated: boolean;
  pathname: string;
  isRTL: boolean;
};

export default function UserMenuDropdown({
  userData,
  showLabel,
  locale,
  role,
  isAuthenticated,
  pathname,
  isRTL,
}: UserMenuDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const roleAccent = role ? (ACCENT[role as keyof typeof ACCENT] ?? ACCENT.user) : ACCENT.user;

  const normalizedPath = useMemo(() => pathname.replace(/\/+$/, ""), [pathname]);

  const isActive = useCallback(
    (href: string) => normalizedPath === href.replace(/\/+$/, ""),
    [normalizedPath],
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // ✅ اجلب الروابط الموحدة
  const { publicLinks, roleLinks } = getUserMenuLinks(locale, isRTL);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 rounded-full p-1 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800",
          roleAccent?.badgeBg,
          roleAccent?.badgeText,
          isOpen && (roleAccent?.activeBg ?? "bg-gray-100 dark:bg-gray-800"),
        )}
      >
        <UserAvatar
          className="h-8 w-8"
          src={userData.avatarUrl}
          alt={userData.displayName}
          fallback={userData.avatarLetter}
        />
        {showLabel && (
          <span className="text-sm truncate max-w-[120px]">
            {userData.email || (isRTL ? "زائر" : "Guest")}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <UserMenuHeader
              displayName={userData.displayName}
              email={userData.email}
              roleLabel={userData.roleLabel}
              accent={roleAccent}
            />
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-500">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-2">
            {/* روابط عامة */}
            {publicLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "block px-4 py-2 text-sm rounded-md transition-colors",
                  isActive(link.href)
                    ? (roleAccent?.menuActive ?? "bg-blue-100 dark:bg-blue-900 font-semibold")
                    : (roleAccent?.navInactive ?? "hover:bg-gray-100 dark:hover:bg-gray-800"),
                )}
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            {/* روابط حسب الدور */}
            {isAuthenticated &&
              role &&
              roleLinks[role as Role]?.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "block px-4 py-2 text-sm rounded-md transition-colors",
                    isActive(link.href)
                      ? (roleAccent?.menuActive ?? "bg-blue-100 dark:bg-blue-900 font-semibold")
                      : (roleAccent?.navInactive ?? "hover:bg-gray-100 dark:hover:bg-gray-800"),
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              ))}

            <div className="border-t border-gray-200 dark:border-gray-700 my-2" />

            {isAuthenticated && (
              <SignOutButton
                label={isRTL ? "تسجيل الخروج" : "Sign Out"}
                className="w-full text-left px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
                redirectPath={`/${locale}/sign-in`}
                onClick={() => setIsOpen(false)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
