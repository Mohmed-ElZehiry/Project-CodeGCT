"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { NextIntlClientProvider } from "next-intl";
import { SupabaseProvider } from "@/lib/supabase/provider";
import type { User } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { Toaster } from "react-hot-toast";
import ErrorBoundary from "@/shared/components/layout/ErrorBoundary";
import logger from "@/lib/utils/logger";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

type Role = Database["public"]["Enums"]["user_role"];

function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}

export function AppProviders({
  children,
  locale,
  messages,
  initialUser = null,
  initialRole = "user",
}: {
  children: ReactNode;
  locale: string;
  messages: Record<string, any>;
  initialUser?: User | null;
  initialRole?: Role;
}) {
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    if (typeof window !== "undefined") {
      const root = window.document.documentElement;
      root.classList.remove("light", "dark");
      const theme = localStorage.getItem("theme") || "system";
      if (
        theme === "dark" ||
        (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
      ) {
        root.classList.add("dark");
      } else {
        root.classList.add("light");
      }
    }
  }, []);

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <NextIntlClientProvider
          locale={locale}
          messages={messages}
          timeZone="Africa/Cairo"
          onError={(error) => {
            if (process.env.NODE_ENV !== "production") {
              logger.logError("Intl error", { error });
            }
          }}
          getMessageFallback={({ key }) => `⚠️ Missing translation: ${key}`}
        >
          <SupabaseProvider initialUser={initialUser} initialRole={initialRole}>
            <ErrorBoundary>
              {children}
              <Toaster position="top-right" />
            </ErrorBoundary>
          </SupabaseProvider>
        </NextIntlClientProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
