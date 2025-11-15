import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import logger from "@/lib/utils/logger";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 1 week
};

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const locale = requestUrl.searchParams.get("locale") || "en";
    const redirectTo = requestUrl.searchParams.get("redirectTo");

    if (!code) throw new Error("No code provided in the callback URL");

    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name: string) => cookieStore.get(name)?.value,
          set: (name: string, value: string, options: any) => {
            cookieStore.set({ name, value, ...COOKIE_OPTIONS, ...options });
          },
          remove: (name: string, options: any) => {
            cookieStore.set({
              name,
              value: "",
              ...COOKIE_OPTIONS,
              ...options,
              maxAge: 0,
            });
          },
        },
      },
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      logger.logError("Error exchanging code for session", { error });
      throw error;
    }
    if (!data.session) throw new Error("No session returned after code exchange");

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.session.user.id)
      .single();

    if (profileError) {
      logger.logError("Error fetching profile role", { error: profileError.message });
    }

    let redirectPath = `/${locale}/user/dashboard`;
    if (profile?.role === "admin") redirectPath = `/${locale}/admin/dashboard`;
    else if (profile?.role === "support") redirectPath = `/${locale}/support/dashboard`;

    const redirectUrl = redirectTo?.startsWith(`/${locale}/`)
      ? new URL(redirectTo, request.url)
      : new URL(redirectPath, request.url);

    if (redirectUrl.pathname.includes("/api/auth/callback")) {
      redirectUrl.pathname = redirectPath;
    }

    logger.logInfo("Auth callback success", {
      userId: data.session.user.id,
      role: profile?.role || "user",
      redirect: redirectUrl.pathname,
    });

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    logger.logError("Auth callback error", { error });
    const locale = new URL(request.url).searchParams.get("locale") || "en";
    const signInUrl = new URL(`/${locale}/sign-in`, request.url);
    signInUrl.searchParams.set("error", "auth_error");
    return NextResponse.redirect(signInUrl);
  }
}
