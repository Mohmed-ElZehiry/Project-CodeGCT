// src/features/user/services/profileService.ts
import { createClient } from "@/lib/supabase/client";
import type { UserProfile, UserProfileDB } from "../../types/user";

const supabase = createClient();

/**
 * 🗂️ Map DB row (snake_case) → Frontend type (camelCase)
 */
function mapProfileFromDB(db: UserProfileDB): UserProfile {
  return {
    id: db.id,
    fullName: db.full_name ?? null,
    displayName: db.display_name ?? null,
    email: db.email ?? null,
    image: db.image ?? null,
    role: db.role ?? "user",
    createdAt: db.created_at,
    updatedAt: db.updated_at,
    lastLoginAt: db.last_login_at ? new Date(db.last_login_at) : null,
  };
}

/**
 * 📥 جلب بيانات الملف الشخصي للمستخدم
 */
export async function fetchUserProfile(userId: string): Promise<UserProfile> {
  // جلب البريد الإلكتروني من جدول auth.users
  const { data: authData, error: authError } = await supabase
    .from("auth.users" as any)
    .select("email")
    .eq("id", userId as any)
    .single();

  const authEmail = (authData as any)?.email ?? null;

  if (authError) {
    console.warn("⚠️ Could not fetch user email:", authError.message);
  }

  // جلب بيانات الملف الشخصي من جدول profiles
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, display_name, image, role, created_at, updated_at, last_login_at")
    .eq("id", userId as any)
    .single();

  if (error || !data) {
    console.error("❌ fetchUserProfile error:", error?.message, error?.details);
    throw new Error(`Failed to fetch profile for user ${userId}`);
  }

  const profileData = {
    ...(data as any),
    email: authEmail,
  } as UserProfileDB;

  return mapProfileFromDB(profileData);
}

/**
 * ✏️ تحديث بيانات الملف الشخصي
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<Pick<UserProfile, "fullName" | "displayName" | "image">>,
): Promise<UserProfile> {
  // First, update the profile data
  const { data: profileData, error: profileError } = await (supabase as any)
    .from("profiles")
    .update({
      full_name: updates.fullName,
      display_name: updates.displayName,
      image: updates.image,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select("id, full_name, display_name, image, role, created_at, updated_at, last_login_at")
    .single();

  if (profileError || !profileData) {
    console.error("❌ updateUserProfile error:", profileError?.message, profileError?.details);
    throw new Error(`Failed to update profile for user ${userId}`);
  }

  // Get the email from auth.users
  const { data: authData, error: authError } = await (supabase as any)
    .from("auth.users")
    .select("email")
    .eq("id", userId)
    .single();

  if (authError) {
    console.warn("⚠️ Could not fetch user email:", authError.message);
  }

  // Combine the data with email
  const combinedData = {
    ...profileData,
    email: authData?.email ?? null,
  } as UserProfileDB;

  return mapProfileFromDB(combinedData);
}

/**
 * ➕ إنشاء أو تعديل (Upsert) بيانات الملف الشخصي
 */
export async function upsertUserProfile(
  userId: string,
  data: Partial<UserProfile>,
): Promise<UserProfile> {
  // First, upsert the profile data
  const { data: profileData, error: profileError } = await (supabase as any)
    .from("profiles")
    .upsert({
      id: userId,
      full_name: data.fullName,
      display_name: data.displayName,
      image: data.image,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select("id, full_name, display_name, image, role, created_at, updated_at, last_login_at")
    .single();

  if (profileError || !profileData) {
    console.error("❌ upsertUserProfile error:", profileError?.message, profileError?.details);
    throw new Error(`Failed to upsert profile for user ${userId}`);
  }

  // Get the email from auth.users
  const { data: authData, error: authError } = await (supabase as any)
    .from("auth.users")
    .select("email")
    .eq("id", userId)
    .single();

  if (authError) {
    console.warn("⚠️ Could not fetch user email:", authError.message);
  }

  // Combine the data with email
  const combinedData = {
    ...profileData,
    email: authData?.email ?? null,
  } as UserProfileDB;

  return mapProfileFromDB(combinedData);
}
