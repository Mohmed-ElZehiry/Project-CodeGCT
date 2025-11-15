"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/shared/components/layout/Navbar";
import Footer from "@/shared/components/layout/Footer";
import { useMemo } from "react";
import DashboardSkeleton from "@/shared/components/layout/Dashboard/skeletons/DashboardSkeleton";
import { useSupabase } from "@/lib/supabase/provider";

interface DashboardLayoutWrapperProps {
  children: React.ReactNode;
}

export default function DashboardLayoutWrapper({ children }: DashboardLayoutWrapperProps) {
  const pathname = usePathname();

  const { role, isAuthenticated, loading } = useSupabase();

  // ✅ Regex: Dashboard route
  const isDashboardRoute = /^\/[a-z]{2}\/(admin|user|support)\/dashboard(\/.*)?$/.test(pathname);
  const isMainPage = /^\/(|[a-z]{2}(|\/))$/.test(pathname);

  const normalizedPath = useMemo(() => pathname.replace(/^\/[a-z]{2}(?=\/)/i, ""), [pathname]);
  const scope = useMemo(() => {
    const segments = normalizedPath.split("/").filter(Boolean);
    return segments[0] ?? "";
  }, [normalizedPath]);

  // ✅ Dashboard routes
  if (isDashboardRoute) {
    if (loading) {
      return <DashboardSkeleton type="list" items={3} />;
    }

    if (!isAuthenticated) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-red-500 font-semibold">🚫 Unauthorized</p>
        </div>
      );
    }

    if (
      (scope === "admin" && role !== "admin") ||
      (scope === "support" && role !== "support") ||
      (scope === "user" && role !== "user")
    ) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-red-500 font-semibold">🚫 Unauthorized</p>
        </div>
      );
    }

    return <>{children}</>;
  }

  // ✅ Main page layout
  if (isMainPage) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 w-full">{children}</main>
        <Footer />
      </div>
    );
  }

  // ✅ Default layout
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="container flex-1 w-full py-8 px-4 mx-auto">{children}</main>
      <Footer />
    </div>
  );
}
