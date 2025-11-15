"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import { Button } from "@/shared/components/ui/button";
import logger from "@/lib/utils/logger";
import { toast } from "react-hot-toast";

export default function SignIn() {
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient>>();
  const [isLoading, setIsLoading] = useState<"google" | "github" | null>(null);

  useEffect(() => {
    setSupabase(createClient());
  }, []);

  const handleOAuthSignIn = useCallback(
    async (provider: "google" | "github") => {
      if (!supabase) {
        logger.logError("Supabase client not initialized");
        return;
      }

      setIsLoading(provider);

      try {
        const currentLocale = window.location.pathname.split("/")[1] || "en";
        const searchParams = new URLSearchParams(window.location.search);
        let redirectTo = searchParams.get("redirectTo");

        if (redirectTo) {
          try {
            redirectTo = decodeURIComponent(redirectTo);
          } catch (error) {
            logger.logWarn("Failed to decode redirectTo parameter", { error, redirectTo });
            redirectTo = "";
          }
        }

        if (
          !redirectTo ||
          redirectTo.startsWith("/_next") ||
          redirectTo.includes("sign-in") ||
          !redirectTo.startsWith(`/${currentLocale}/`)
        ) {
          redirectTo = "";
        }

        const callbackUrl = new URL("/api/auth/callback", window.location.origin);
        callbackUrl.searchParams.set("locale", currentLocale);
        if (redirectTo) {
          callbackUrl.searchParams.set("redirectTo", redirectTo);
        }

        // ✅ Start OAuth sign in directly (no need for manual signOut + delay)
        const { error: signInError } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: callbackUrl.toString(),
            queryParams: {
              prompt: "select_account",
              ...(provider === "google" && {
                access_type: "offline",
                prompt: "select_account consent",
              }),
            },
            skipBrowserRedirect: false,
            scopes: "email profile",
          },
        });

        if (signInError) {
          logger.logError(`Error signing in with ${provider}`, { error: signInError });
          toast.error(
            provider === "google"
              ? "تعذر تسجيل الدخول بحساب جوجل. حاول مرة أخرى."
              : "تعذر تسجيل الدخول بحساب جيت هب. حاول مرة أخرى.",
          );
        }
      } catch (error) {
        logger.logError("Unexpected Sign-In Error", { error });
        toast.error("حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.");
      } finally {
        setIsLoading(null);
      }
    },
    [supabase],
  );

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 dark:bg-gray-900">
      <div className="w-full max-w-md space-y-6 rounded-lg bg-white p-8 shadow-md dark:bg-gray-800">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative h-16 w-16">
            <Image src="/logo.png" alt="Logo" fill className="object-contain" priority />
          </div>
          <h1 className="text-2xl font-bold">مرحباً بك</h1>
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            سجل الدخول للمتابعة إلى لوحة التحكم
          </p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={() => handleOAuthSignIn("google")}
            className="w-full"
            variant="outline"
            disabled={!!isLoading}
          >
            {isLoading === "google" ? "جاري التحميل..." : "تسجيل الدخول بحساب جوجل"}
          </Button>

          <Button
            onClick={() => handleOAuthSignIn("github")}
            className="w-full"
            variant="outline"
            disabled={!!isLoading}
          >
            {isLoading === "github" ? "جاري التحميل..." : "تسجيل الدخول بحساب جيت هب"}
          </Button>
        </div>

        {isLoading && (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            جاري إعادة التوجيه...
          </p>
        )}
      </div>
    </div>
  );
}
