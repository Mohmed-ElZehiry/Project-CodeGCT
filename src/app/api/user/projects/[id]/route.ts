"use server";

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logError, logInfo } from "@/lib/utils/logger";

type RouteContext = {
  params: {
    id: string;
  };
};

// 📥 GET: جلب تفاصيل مشروع واحد
export async function GET(req: NextRequest, context: any) {
  const { params } = context as RouteContext;
  const { id } = params;
  if (!id) return NextResponse.json({ error: "Missing project id" }, { status: 400 });

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("projects").select("*").eq("id", id).single();

    if (error || !data) throw error;

    logInfo("✅ Project retrieved", { projectId: id });
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    logError("❌ Failed to retrieve project", { projectId: id, error: err?.message });
    return NextResponse.json({ error: err?.message || "Project not found" }, { status: 404 });
  }
}

// ✏️ PATCH: تحديث مشروع
export async function PATCH(req: NextRequest, context: any) {
  const { params } = context as RouteContext;
  const { id } = params;
  if (!id) return NextResponse.json({ error: "Missing project id" }, { status: 400 });

  try {
    const body = await req.json();
    const { name, description } = body;

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("projects")
      .update({
        name,
        description,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error || !data) throw error;

    logInfo("✅ Project updated", { projectId: id });
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    logError("❌ Failed to update project", { projectId: id, error: err?.message });
    return NextResponse.json(
      { error: err?.message || "Failed to update project" },
      { status: 500 },
    );
  }
}

// 🗑️ DELETE: حذف مشروع
export async function DELETE(req: NextRequest, context: any) {
  const { params } = context as RouteContext;
  const { id } = params;
  if (!id) return NextResponse.json({ error: "Missing project id" }, { status: 400 });

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("projects").delete().eq("id", id);

    if (error) throw error;

    logInfo("✅ Project deleted", { projectId: id });
    return NextResponse.json({ success: true, message: "Project deleted successfully" });
  } catch (err: any) {
    logError("❌ Failed to delete project", { projectId: id, error: err?.message });
    return NextResponse.json(
      { error: err?.message || "Failed to delete project" },
      { status: 500 },
    );
  }
}

// ✅ HEAD: إرجاع metadata فقط
export async function HEAD(req: NextRequest, context: any) {
  const { params } = context as RouteContext;
  const { id } = params;
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("projects")
      .select("created_at, updated_at")
      .eq("id", id)
      .single();

    if (!data) return new NextResponse(null, { status: 404 });

    return new NextResponse(null, {
      status: 200,
      headers: {
        "X-Created-At": data.created_at ?? "",
        "X-Updated-At": data.updated_at ?? "",
      },
    });
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}
