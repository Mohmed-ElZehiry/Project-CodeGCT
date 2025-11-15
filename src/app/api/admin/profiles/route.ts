// src/app/api/admin/profiles/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  fetchUserProfileServer,
  updateUserProfileServer,
} from "@/features/user/services/profile/serverProfileService";
import { logError, logInfo } from "@/lib/utils/logger";

export const dynamic = "force-dynamic"; // Ensure this is a dynamic route

// ✅ GET: جلب بيانات البروفايل للمستخدم الحالي
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      logError("❌ Error retrieving auth user for profile", { error: error?.message });
      return NextResponse.json(
        { success: false, data: null, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const profile = await fetchUserProfileServer(user.id);

    logInfo("✅ Profile retrieved successfully", { userId: profile.id });

    return NextResponse.json({
      success: true,
      data: profile,
      error: null,
    });
  } catch (err: any) {
    logError("❌ Error retrieving profile", { error: err?.message });
    return NextResponse.json(
      { success: false, data: null, error: err?.message || "Failed to retrieve profile" },
      { status: 500 },
    );
  }
}

// ✅ PUT: تحديث بيانات البروفايل للمستخدم الحالي
export async function PUT(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      logError("❌ Error retrieving auth user for profile update", { error: error?.message });
      return NextResponse.json(
        { success: false, data: null, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await req.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, data: null, error: "Invalid request body" },
        { status: 400 },
      );
    }

    const updated = await updateUserProfileServer(user.id, body);

    logInfo("✅ Profile updated successfully", { userId: updated.id });

    return NextResponse.json({
      success: true,
      data: updated,
      error: null,
    });
  } catch (err: any) {
    logError("❌ Error updating profile", { error: err?.message });
    return NextResponse.json(
      { success: false, data: null, error: err?.message || "Failed to update profile" },
      { status: 500 },
    );
  }
}
