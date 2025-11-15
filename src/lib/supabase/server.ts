"use server";

import { createServerClient } from "@supabase/ssr";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { Database } from "./database.types";
import logger from "../utils/logger";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

/**
 * ✅ Supabase Server Client
 * - لازم تكون async علشان Next.js يعتبرها Server Action صحيحة
 * - لازم نعمل await للـ cookies() قبل الاستخدام
 */
export async function createSupabaseServerClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies(); // ✅ لازم await هنا

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) throw new Error("❌ Missing NEXT_PUBLIC_SUPABASE_URL");
  if (!anonKey) throw new Error("❌ Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set() {
        // Next.js App Router لا يسمح بالكتابة في الكوكيز هنا
      },
      remove() {
        // نفس الكلام، نحافظ على التوافق مع الـ API
      },
    },
  });
}

export async function createSupabaseAdminClient(): Promise<SupabaseClient<Database>> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error("❌ Missing NEXT_PUBLIC_SUPABASE_URL");
  if (!serviceKey) throw new Error("❌ Missing SUPABASE_SERVICE_ROLE_KEY");

  return createClient<Database>(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * ✅ Get or Create Profile
 * - يجلب أو ينشئ الـ profile للمستخدم
 * - يحافظ على الدور الحالي أو يقرأه من metadata
 */
export async function getOrCreateProfile(): Promise<Profile | null> {
  try {
    const supabase = await createSupabaseServerClient();

    // جلب المستخدم الحالي
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (!user) {
      if (userError && userError.message !== "Auth session missing!") {
        logger.logError("Error getting user", { error: userError.message });
      }
      return null;
    }

    // جلب الـ session
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return null;

    // جلب الدور الحالي من DB
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("role, created_at")
      .eq("id", user.id)
      .single();

    const now = new Date().toISOString();

    // تحديد الدور
    const role =
      existingProfile?.role || (user.user_metadata?.role as "user" | "admin" | "support") || "user";

    const profilePayload = {
      id: user.id,
      full_name: user.user_metadata?.full_name || "",
      display_name: user.user_metadata?.name || user.email?.split("@")[0] || "User",
      image: user.user_metadata?.avatar_url || "",
      role,
      created_at: existingProfile?.created_at || now,
      updated_at: now,
    };

    // إنشاء أو تحديث الـ profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .upsert(profilePayload, { onConflict: "id" })
      .select()
      .single();

    let finalProfile = profile;

    if (profileError || !profile) {
      logger.logWarn("Session client failed to upsert profile, retrying with admin client", {
        error: profileError?.message ?? "unknown",
        userId: user.id,
      });

      const adminSupabase = await createSupabaseAdminClient();
      const { data: adminProfile, error: adminError } = await adminSupabase
        .from("profiles")
        .upsert(profilePayload, { onConflict: "id" })
        .select()
        .single();

      if (adminError || !adminProfile) {
        logger.logError("Error fetching/creating profile", {
          error: adminError?.message ?? profileError?.message,
        });
        return null;
      }

      finalProfile = adminProfile;
    }

    if (!finalProfile) {
      logger.logError("Failed to create or retrieve profile", { userId: user.id });
      return null;
    }

    logger.logInfo("Profile ready", {
      userId: user.id,
      role: finalProfile.role,
    });
    return finalProfile;
  } catch (error) {
    logger.logError("Error in getOrCreateProfile", { error });
    return null;
  }
}

export { createSupabaseServerClient as getSupabaseServerClient };
