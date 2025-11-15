"use client";

import { useMemo } from "react";
import { useParams, usePathname } from "next/navigation";
import { useAuth } from "@/shared/hooks/useAuth";
import UserMenuInline from "./UserMenuInline";
import UserMenuDropdown from "./UserMenuDropdown";
import type { Database } from "@/lib/supabase/database.types";

type Role = Database["public"]["Enums"]["user_role"];

type UserMenuProps = {
  showLabel?: boolean;
  variant?: "dropdown" | "inline";
  locale?: string;
};

export default function UserMenu({
  showLabel = true,
  variant = "dropdown",
  locale: propLocale,
}: UserMenuProps) {
  const { user, role = "user", isAuthenticated } = useAuth();
  const params = useParams();
  const pathname = usePathname();
  const locale = propLocale || (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  // ✅ بيانات المستخدم مع fallbacks
  const userData = useMemo(
    () => ({
      displayName:
        user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? (isRTL ? "مستخدم" : "User"),
      avatarLetter: user?.email?.[0]?.toUpperCase() ?? "U",
      avatarUrl: user?.user_metadata?.avatar_url ?? null,
      roleLabel:
        role === "admin"
          ? isRTL
            ? "مشرف"
            : "ADMIN"
          : role === "support"
            ? isRTL
              ? "دعم"
              : "SUPPORT"
            : isRTL
              ? "مستخدم"
              : "USER",
      email: user?.email ?? (isRTL ? "غير مسجل" : "Not signed in"),
    }),
    [user, role, isRTL],
  );

  // ✅ Inline Mode
  if (variant === "inline") {
    return <UserMenuInline userData={userData} role={role} locale={locale} />;
  }

  // ✅ Dropdown Mode
  return (
    <UserMenuDropdown
      userData={userData}
      showLabel={showLabel}
      locale={locale}
      role={role}
      isAuthenticated={isAuthenticated}
      pathname={pathname}
      isRTL={isRTL}
    />
  );
}
