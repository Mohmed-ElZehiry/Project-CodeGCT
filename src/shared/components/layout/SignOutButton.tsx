"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { useSupabase } from "@/lib/supabase/provider";
import logger from "@/lib/utils/logger";

type SignOutButtonProps = {
  label?: string;
  className?: string;
  onClick?: () => void;
  redirectPath?: string;
};

export default function SignOutButton({
  label = "تسجيل الخروج",
  className = "",
  onClick,
  redirectPath = "/sign-in",
}: SignOutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { supabase, setUser, setRole } = useSupabase();

  const handleSignOut = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();

      onClick?.();
      setLoading(true);

      try {
        // ✅ امسح الكوكيز من السيرفر أولاً
        await fetch("/api/auth/signout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include", // مهم علشان الكوكيز تتبعت
        });

        // ✅ تسجيل الخروج من Supabase (الـ client)
        const { error } = await supabase.auth.signOut();
        if (error) throw error;

        // ✅ تحديث الحالة محليًا فورًا
        setUser(null);
        setRole("user");

        // ✅ تنظيف التخزين المحلي
        if (typeof window !== "undefined") {
          const supabaseKeys = Object.keys(localStorage).filter(
            (key) =>
              key.startsWith("sb-") ||
              key.startsWith("supabase-") ||
              key.includes("supabase.auth"),
          );
          supabaseKeys.forEach((key) => localStorage.removeItem(key));
        }

        // ✅ التوجيه (اختياري)
        if (redirectPath) {
          router.push(redirectPath);
        }
      } catch (error) {
        logger.logError("Error signing out", { error });
        if (redirectPath) {
          router.push(redirectPath);
        }
      } finally {
        setLoading(false);
      }
    },
    [onClick, redirectPath, router, supabase.auth, setUser, setRole],
  );

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className={cn(
        "w-full px-4 py-2 text-sm rounded-md transition-colors flex items-center justify-center",
        loading
          ? "opacity-70 cursor-not-allowed bg-gray-300 dark:bg-gray-700"
          : "hover:bg-gray-100 dark:hover:bg-gray-800 text-left",
        className,
      )}
    >
      {loading ? (label === "Sign Out" ? "Signing out..." : "جارٍ تسجيل الخروج...") : label}
    </button>
  );
}
