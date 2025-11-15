"use server";

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logError, logInfo } from "@/lib/utils/logger";

// ✅ POST: إنشاء مقارنة جديدة
export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { upload1Id, upload2Id, projectId, result } = body;

    if (!upload1Id || !upload2Id) {
      return NextResponse.json({ error: "Missing upload IDs" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("comparisons")
      .insert({
        user_id: user.id,
        upload1_id: upload1Id,
        upload2_id: upload2Id,
        project_id: projectId ?? null,
        result,
        status: "completed",
        direction: "forward",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error) throw error;

    logInfo("✅ Comparison created", { comparisonId: data.id, userId: user.id });
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err: any) {
    logError("❌ Comparison creation failed", { error: err?.message });
    return NextResponse.json(
      { error: err?.message || "Failed to create comparison" },
      { status: 500 },
    );
  }
}

// ✅ GET: جلب كل المقارنات الخاصة بالمستخدم الحالي
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("comparisons")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw error;

    logInfo("✅ Comparisons listed", { userId: user.id, count: data.length });
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    logError("❌ Failed to list comparisons", { error: err?.message });
    return NextResponse.json(
      { error: err?.message || "Failed to list comparisons" },
      { status: 500 },
    );
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
      .from("comparisons")
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
