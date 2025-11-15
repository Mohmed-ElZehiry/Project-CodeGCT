"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSupabase } from "@/lib/supabase/provider";
import { isRouteAllowed } from "@/config/roles";

export function useAuthorize(requiredRoles: { allow: string[]; redirect?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const { role, loading, isAuthenticated } = useSupabase();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      router.replace(requiredRoles.redirect ?? "/user/dashboard");
      return;
    }

    if (!requiredRoles.allow.includes(role) || !isRouteAllowed(role, pathname)) {
      router.replace(requiredRoles.redirect ?? "/user/dashboard");
    }
  }, [
    loading,
    isAuthenticated,
    role,
    pathname,
    router,
    requiredRoles.allow,
    requiredRoles.redirect,
  ]);
}
