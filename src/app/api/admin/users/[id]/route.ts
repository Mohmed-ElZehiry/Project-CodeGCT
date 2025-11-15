import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import logger from "@/lib/utils/logger";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: userParam } = await params;
  const userId = userParam;

  if (!userId) {
    return NextResponse.json(
      { success: false, error: "Missing user id", data: null },
      { status: 400 },
    );
  }

  try {
    const { role, status } = (await req.json()) as {
      role?: "user" | "support" | "admin";
      status?: "active" | "suspended" | "pending";
    };

    if (!role && !status) {
      return NextResponse.json(
        { success: false, error: "Nothing to update", data: null },
        { status: 400 },
      );
    }

    const supabase = await createSupabaseServerClient();

    if (role) {
      const adminSupabase = await createSupabaseAdminClient();
      const { error: profileError } = await adminSupabase
        .from("profiles")
        .upsert({ id: userId, role }, { onConflict: "id" });

      if (profileError) {
        logger.logError("admin.users: failed to upsert profile role", {
          error: profileError.message,
          userId,
        });
        return NextResponse.json(
          { success: false, error: profileError.message, data: null },
          { status: 500 },
        );
      }
    }

    const metadataUpdates: Record<string, unknown> = {};
    if (role) metadataUpdates.role = role;
    if (status) metadataUpdates.status = status;

    if (Object.keys(metadataUpdates).length) {
      const { error: metadataError } = await supabase.auth.admin.updateUserById(userId, {
        user_metadata: metadataUpdates,
      });

      if (metadataError) {
        logger.logError("admin.users: failed to update auth metadata", {
          error: metadataError.message,
          userId,
        });
        return NextResponse.json(
          { success: false, error: metadataError.message, data: null },
          { status: 500 },
        );
      }
    }

    const { data: updatedUser, error: fetchError } = await supabase.auth.admin.getUserById(userId);
    if (fetchError || !updatedUser?.user) {
      logger.logError("admin.users: failed to reload user after update", {
        error: fetchError?.message,
        userId,
      });
      return NextResponse.json(
        { success: false, error: fetchError?.message ?? "Failed to load user", data: null },
        { status: 500 },
      );
    }

    const user = updatedUser.user;

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", userId)
      .single();

    const responsePayload = {
      id: user.id,
      email: user.email,
      fullName: profile?.full_name ?? user.user_metadata?.full_name ?? null,
      role: profile?.role ?? (user.user_metadata?.role as string) ?? "user",
      status: (user.user_metadata?.status as string) ?? "active",
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at,
    };

    logger.logInfo("admin.users: user updated", {
      userId,
      role: responsePayload.role,
      status: responsePayload.status,
    });

    return NextResponse.json({ success: true, data: responsePayload, error: null });
  } catch (error) {
    logger.logError("admin.users: unexpected error updating user", { userId, error });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unexpected error",
        data: null,
      },
      { status: 500 },
    );
  }
}
