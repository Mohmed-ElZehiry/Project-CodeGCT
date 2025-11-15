"use client";

import { ReactNode, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import type { Database } from "@/lib/supabase/database.types";
import logger from "@/lib/utils/logger";

type Role = Database["public"]["Enums"]["user_role"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

type DashboardLayoutProps = {
  children: ReactNode;
  profile: Profile;
  version?: string;
};

export default function DashboardLayout({
  children,
  profile,
  version = "1.0.0",
}: DashboardLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const normalizedPath = useMemo(() => pathname.replace(/^\/[a-z]{2}(?=\/)/i, ""), [pathname]);
  const scope = useMemo(() => {
    const segments = normalizedPath.split("/").filter(Boolean);
    return segments[0] ?? "";
  }, [normalizedPath]);

  const role = profile.role as Role;
  const locale = pathname.split("/")[1] || "en";
  const basePath = `/${locale}/${role}/dashboard`;

  // ✅ Role guard داخلي لكل مسار
  if (
    (scope === "admin" && role !== "admin") ||
    (scope === "support" && role !== "support") ||
    (scope === "user" && role !== "user")
  ) {
    logger.logWarn("DashboardLayout unauthorized scope", {
      scope,
      role,
      pathname,
      normalizedPath,
    });
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500 font-semibold">🚫 Unauthorized</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex overflow-hidden bg-background">
      {/* ✅ Overlay للـ sidebar في الموبايل */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ✅ Sidebar */}
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        basePath={basePath}
        version={version}
      />

      {/* ✅ Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        <Topbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-background min-h-0">{children}</main>
      </div>
    </div>
  );
}
