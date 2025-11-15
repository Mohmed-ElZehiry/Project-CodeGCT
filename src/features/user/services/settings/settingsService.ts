// src/features/user/services/settingsService.ts
import { createClient } from "@/lib/supabase/client";
import type { UserSettings, UserSettingsDB } from "../../types/user";

const supabase = createClient();

/**
 * 🗂️ Map DB row (snake_case) → Frontend type (camelCase)
 */
function mapSettingsFromDB(db: UserSettingsDB): UserSettings {
  return {
    id: db.id,
    userId: db.user_id,
    theme: db.theme ?? "light",
    language: db.language ?? "en",
    notifications: db.notifications ?? true,
    timezone: db.timezone ?? "UTC",
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

/**
 * 📥 جلب إعدادات المستخدم
 */
export async function fetchUserSettings(userId: string): Promise<UserSettings> {
  const { data, error } = await (supabase as any)
    .from("user_settings")
    .select("id, user_id, theme, language, notifications, timezone, created_at, updated_at")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    console.error("❌ fetchUserSettings error:", error?.message, error?.details);
    throw new Error(`Failed to fetch settings for user ${userId}`);
  }

  return mapSettingsFromDB(data as UserSettingsDB);
}

/**
 * ✏️ تحديث إعدادات المستخدم
 */
export async function updateUserSettings(
  userId: string,
  updates: Partial<UserSettings>,
): Promise<UserSettings> {
  const { data, error } = await (supabase as any)
    .from("user_settings")
    .update({
      theme: updates.theme,
      language: updates.language,
      notifications: updates.notifications,
      timezone: updates.timezone,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .select("id, user_id, theme, language, notifications, timezone, created_at, updated_at")
    .single();

  if (error || !data) {
    console.error("❌ updateUserSettings error:", error?.message, error?.details);
    throw new Error(`Failed to update settings for user ${userId}`);
  }

  return mapSettingsFromDB(data as UserSettingsDB);
}

/**
 * ➕ إنشاء أو تعديل (Upsert) إعدادات المستخدم
 */
export async function upsertUserSettings(
  userId: string,
  settings: Partial<UserSettings>,
): Promise<UserSettings> {
  const { data, error } = await (supabase as any)
    .from("user_settings")
    .upsert(
      {
        user_id: userId,
        theme: settings.theme ?? "light",
        language: settings.language ?? "en",
        notifications: settings.notifications ?? true,
        timezone: settings.timezone ?? "UTC",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select("id, user_id, theme, language, notifications, timezone, created_at, updated_at")
    .single();

  if (error || !data) {
    console.error("❌ upsertUserSettings error:", error?.message, error?.details);
    throw new Error(`Failed to upsert settings for user ${userId}`);
  }

  return mapSettingsFromDB(data as UserSettingsDB);
}
