import { NextResponse } from "next/server";
import logger from "@/lib/utils/logger";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function deriveStatus(user: any): "active" | "suspended" | "pending" {
  const metadataStatus = user.user_metadata?.status as
    | "active"
    | "suspended"
    | "pending"
    | undefined;
  if (metadataStatus) return metadataStatus;
  if (user.banned_until) return "suspended";
  if (user.email_confirmed_at) return "active";
  return "pending";
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase.auth.admin.listUsers({ perPage: 200 });
    if (error) {
      logger.logError("admin.users: failed to list users", { error: error.message });
      return NextResponse.json(
        { success: false, error: error.message, data: null },
        { status: 500 },
      );
    }

    const users = data?.users ?? [];
    const userIds = users.map((user) => user.id);

    let profiles: Record<string, any> = {};
    if (userIds.length) {
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, role, created_at")
        .in("id", userIds);

      if (profilesError) {
        logger.logError("admin.users: failed to load profiles", { error: profilesError.message });
      } else {
        profiles = Object.fromEntries((profilesData ?? []).map((profile) => [profile.id, profile]));
      }
    }

    const mapped = users.map((user) => {
      const profile = profiles[user.id];
      return {
        id: user.id,
        email: user.email,
        fullName: profile?.full_name ?? user.user_metadata?.full_name ?? null,
        role: profile?.role ?? (user.user_metadata?.role as string) ?? "user",
        status: deriveStatus(user),
        createdAt: user.created_at,
        lastSignInAt: user.last_sign_in_at,
      };
    });

    logger.logInfo("admin.users: listed users", { count: mapped.length });

    return NextResponse.json({ success: true, data: mapped, error: null });
  } catch (error) {
    logger.logError("admin.users: unexpected failure", { error });
    return NextResponse.json(
      { success: false, error: "Unexpected error", data: null },
      { status: 500 },
    );
  }
}
