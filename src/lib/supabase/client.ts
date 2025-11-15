"use client";

import { createBrowserClient } from "@supabase/ssr";
import { Database } from "./database.types";
import logger from "../utils/logger"; // ✅ استخدم اللوجر الموحد
import { storage } from "../utils/storage"; // ✅ اعمل abstraction للـ storage

// ✅ تحقق من وجود المتغيرات البيئية
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error("❌ Missing env.NEXT_PUBLIC_SUPABASE_URL");
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error("❌ Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

// ✅ دالة لإنشاء Supabase Client
export const createClient = () => {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: "pkce",
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
        storage: {
          getItem: (key: string): string | null => {
            try {
              return (storage.get(key) as string | null) ?? null;
            } catch (error) {
              logger.logError(`Error getting auth data for key "${key}"`, { error });
              return null;
            }
          },
          setItem: (key: string, value: string): void => {
            try {
              storage.set(key, value);
            } catch (error) {
              logger.logError(`Error setting auth data for key "${key}"`, { error });
            }
          },
          removeItem: (key: string): void => {
            try {
              storage.remove(key);
            } catch (error) {
              logger.logError(`Error removing auth data for key "${key}"`, { error });
            }
          },
        },
      },
    },
  );
};

// ✅ أنشئ نسخة واحدة من Supabase Client
export const supabase = createClient();

// ✅ اجعلها متاحة كـ default export كمان
export default supabase;
