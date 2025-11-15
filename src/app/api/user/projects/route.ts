"use server";

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logError, logInfo } from "@/lib/utils/logger";

// ✅ POST: إنشاء مشروع جديد
export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, description } = body;

    if (!name) return NextResponse.json({ error: "Missing project name" }, { status: 400 });

    const { data, error } = await supabase
      .from("projects")
      .insert({
        name,
        description,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error) throw error;

    logInfo("✅ Project created", { projectId: data.id, userId: user.id });
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err: any) {
    logError("❌ Project creation failed", { error: err?.message });
    return NextResponse.json(
      { error: err?.message || "Failed to create project" },
      { status: 500 },
    );
  }
}

// ✅ GET: جلب كل مشروعات المستخدم الحالي مع Pagination
export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    logInfo("✅ Projects listed", { userId: user.id, count: data.length });
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    logError("❌ Failed to list projects", { error: err?.message });
    return NextResponse.json({ error: err?.message || "Failed to list projects" }, { status: 500 });
  }
}

// ✅ HEAD: إرجاع metadata فقط
export async function HEAD() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return new NextResponse(null, { status: 401 });

    const { count, error } = await supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (error) throw error;

    return new NextResponse(null, {
      status: 200,
      headers: {
        "X-Total-Count": count?.toString() ?? "0",
      },
    });
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}
