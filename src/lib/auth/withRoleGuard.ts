import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getOrCreateProfile } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import logger from "@/lib/utils/logger";

type Role = Database["public"]["Enums"]["user_role"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export async function withRoleGuard(
  allowedRoles: Role | Role[],
  locale: string,
): Promise<Profile | never> {
  const profile = await getOrCreateProfile();

  // ✅ لازم await هنا
  const headersList = await headers();
  let currentPath =
    headersList.get("x-invoke-path") || headersList.get("referer") || `/${locale}`;

  if (currentPath.startsWith("http://") || currentPath.startsWith("https://")) {
    try {
      const parsed = new URL(currentPath);
      currentPath = `${parsed.pathname}${parsed.search}`;
    } catch (error) {
      logger.logWarn("Invalid referer URL encountered", {
        locale,
        currentPath,
        error: error instanceof Error ? error.message : String(error),
      });
      currentPath = `/${locale}`;
    }
  }

  if (!currentPath.startsWith("/")) {
    currentPath = `/${currentPath.replace(/^\/+/, "")}`;
  }

  if (!currentPath.startsWith(`/${locale}/`) && currentPath !== `/${locale}`) {
    currentPath = `/${locale}`;
  }

  const encodedRedirectTo = encodeURIComponent(currentPath);

  if (!profile) {
    logger.logWarn("No profile found, redirecting to sign-in", {
      locale,
      redirectTo: encodedRedirectTo,
    });
    return redirect(`/${locale}/sign-in?redirectTo=${encodedRedirectTo}`);
  }

  const rolesArray: Role[] = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  const userRole: Role = profile.role;

  if (!rolesArray.includes(userRole)) {
    logger.logWarn("Unauthorized access attempt", {
      required: rolesArray,
      got: userRole,
      locale,
    });
    return redirect(`/${locale}/unauthorized`);
  }

  logger.logInfo("Access granted", {
    userId: profile.id,
    role: userRole,
    locale,
  });

  return profile;
}
