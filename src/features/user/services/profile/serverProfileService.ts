// src/features/user/services/profile/serverProfileService.ts
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UserProfile, UserProfileDB } from "../../types/user";

// Extend the Database type to include auth.users
type AuthUser = {
  id: string;
  email?: string;
};

type ProfileRow = {
  id: string;
  full_name?: string | null;
  display_name?: string | null;
  image?: string | null;
  role?: UserProfileDB["role"] | null;
  created_at: string;
  updated_at: string;
  last_login_at?: string | null;
};

function toUserProfileDB(row: ProfileRow, email: string | null): UserProfileDB {
  return {
    id: row.id,
    full_name: row.full_name ?? null,
    display_name: row.display_name ?? null,
    image: row.image ?? null,
    role: row.role ?? "user",
    created_at: row.created_at,
    updated_at: row.updated_at,
    last_login_at: row.last_login_at ?? null,
    email: email ?? null,
  };
}

function isProfileRow(value: unknown): value is ProfileRow {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Partial<ProfileRow>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.created_at === "string" &&
    typeof candidate.updated_at === "string"
  );
}

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
 * 📥 Get user email from auth.users table (Server-side)
 */
async function getUserEmail(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
): Promise<string | null> {
  try {
    // Use auth.getUser() instead of querying auth.users directly
    const {
      data: { user },
      error,
    } = await supabase.auth.admin.getUserById(userId);

    if (error || !user) {
      console.warn("⚠️ Could not fetch user email:", error?.message);
      return null;
    }

    return user.email ?? null;
  } catch (error) {
    console.warn("⚠️ Error fetching user email:", error);
    return null;
  }
}

/**
 * 📥 Fetch user profile (Server-side)
 */
export async function fetchUserProfileServer(userId: string): Promise<UserProfile> {
  const supabase = await createSupabaseServerClient();

  // Get email using auth admin API
  const email = await getUserEmail(supabase, userId);

  // Get profile data from profiles table
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, display_name, image, role, created_at, updated_at, last_login_at")
    .eq("id", userId)
    .single();

  if (error || !data || !isProfileRow(data)) {
    console.error("❌ fetchUserProfileServer error:", error?.message, error?.details);
    throw new Error(`Failed to fetch profile for user ${userId}`);
  }

  const profileData = toUserProfileDB(data, email);

  return mapProfileFromDB(profileData);
}

/**
 * ✏️ Update user profile (Server-side)
 */
export async function updateUserProfileServer(
  userId: string,
  updates: Partial<Pick<UserProfile, "fullName" | "displayName" | "image">>,
): Promise<UserProfile> {
  const supabase = await createSupabaseServerClient();

  // Update the profile data
  const { data: profileRow, error: profileError } = await supabase
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

  if (profileError || !profileRow || !isProfileRow(profileRow)) {
    console.error(
      "❌ updateUserProfileServer error:",
      profileError?.message,
      profileError?.details,
    );
    throw new Error(`Failed to update profile for user ${userId}`);
  }

  // Get email using auth admin API
  const email = await getUserEmail(supabase, userId);

  // Combine the data with email
  const combinedData = toUserProfileDB(profileRow, email);

  return mapProfileFromDB(combinedData);
}
