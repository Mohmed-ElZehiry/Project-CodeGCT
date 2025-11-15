import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/supabase/database.types";
import logger from "@/lib/utils/logger";

const intlMiddleware = createIntlMiddleware({
  locales: ["en", "ur"],
  defaultLocale: "en",
});

const PROTECTED_PREFIXES = ["user", "admin", "support"] as const;
type AppRole = Database["public"]["Enums"]["user_role"];

function isProtectedRoute(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length < 2) return false;
  const [locale, scope] = segments;
  if (!PROTECTED_PREFIXES.includes(scope as (typeof PROTECTED_PREFIXES)[number])) {
    return false;
  }
  return ["user", "admin", "support"].some((prefix) => pathname.startsWith(`/${locale}/${prefix}`));
}

export async function middleware(request: NextRequest) {
  const intlResponse = intlMiddleware(request);
  const response = intlResponse ?? NextResponse.next({ request: { headers: request.headers } });

  const path = request.nextUrl.pathname;
  const locale = path.split("/")[1] || "en";
  const userAgent = request.headers.get("user-agent") ?? "unknown";
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";

  // مسارات عامة
  const publicPaths = [
    `/${locale}/sign-in`,
    `/${locale}/auth/callback`,
    `/${locale}/unauthorized`,
    `/${locale}/_next`,
    `/${locale}/api/auth`,
  ];
  if (publicPaths.some((prefix) => path.startsWith(prefix))) {
    return response;
  }

  if (!isProtectedRoute(path)) {
    return response;
  }

  // ✅ استخدم createMiddlewareClient (Edge-compatible)
  const supabase = createMiddlewareClient<Database>({ req: request, res: response });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const protectedRoutes = [`/${locale}/user`, `/${locale}/admin`, `/${locale}/support`];

  // ✅ لو مفيش session → redirect sign-in
  if (!session && protectedRoutes.some((route) => path.startsWith(route))) {
    logger.logWarn("Unauthorized access - no session", { path, locale, ip, userAgent });
    const signInUrl = new URL(`/${locale}/sign-in`, request.url);
    signInUrl.searchParams.set("redirectTo", path);
    return NextResponse.redirect(signInUrl);
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (!user || userError) {
    logger.logError("Failed to fetch user", { error: userError?.message, path, ip, userAgent });
    const signInUrl = new URL(`/${locale}/sign-in`, request.url);
    signInUrl.searchParams.set("redirectTo", path);
    return NextResponse.redirect(signInUrl);
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError) {
    logger.logError("Error fetching profile role", { error: profileError.message });
  }
  const profileRole = (profile as { role?: AppRole | null } | null)?.role ?? "user";
  const userRole: AppRole = profileRole as AppRole;
  const url = request.nextUrl.clone();

  // ✅ لو user دخل /sign-in وهو logged in → redirect للـ dashboard
  if (path === `/${locale}/sign-in`) {
    const redirectTo = new URL(request.url).searchParams.get("redirectTo");
    if (redirectTo && redirectTo.startsWith(`/${locale}/`)) {
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }
    const rolePath = userRole === "admin" ? "admin" : userRole === "support" ? "support" : "user";
    url.pathname = `/${locale}/${rolePath}/dashboard`;
    return NextResponse.redirect(url);
  }

  // ✅ حماية المسارات حسب الدور
  if (path.startsWith(`/${locale}/admin`) && userRole !== "admin") {
    logger.logWarn("Unauthorized admin access attempt", { userId: user.id, role: userRole, ip, userAgent });
    url.pathname = `/${locale}/unauthorized`;
    return NextResponse.redirect(url);
  }
  if (path.startsWith(`/${locale}/support`) && !["admin", "support"].includes(userRole)) {
    logger.logWarn("Unauthorized support access attempt", { userId: user.id, role: userRole, ip, userAgent });
    url.pathname = `/${locale}/unauthorized`;
    return NextResponse.redirect(url);
  }

  logger.logInfo("Access granted via middleware", { userId: user.id, role: userRole, path });

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth/callback|assets|.*\\..).*)"],
};
