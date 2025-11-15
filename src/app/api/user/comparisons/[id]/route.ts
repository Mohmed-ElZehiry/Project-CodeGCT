"use server";

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logError, logInfo } from "@/lib/utils/logger";

type RouteContext = {
  params: {
    id: string;
  };
};

// 📥 GET: جلب مقارنة واحدة
export async function GET(req: NextRequest, context: any) {
  const { params } = context as RouteContext;
  const { id } = params;
  if (!id) return NextResponse.json({ error: "Missing comparison id" }, { status: 400 });

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("comparisons").select("*").eq("id", id).single();

    if (error || !data) throw error;

    logInfo("✅ Comparison retrieved", { comparisonId: id });
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    logError("❌ Failed to retrieve comparison", { comparisonId: id, error: err?.message });
    return NextResponse.json({ error: err?.message || "Comparison not found" }, { status: 404 });
  }
}

// ✏️ PATCH: تحديث مقارنة
export async function PATCH(req: NextRequest, context: any) {
  const { params } = context as RouteContext;
  const { id } = params;
  if (!id) return NextResponse.json({ error: "Missing comparison id" }, { status: 400 });

  try {
    const body = await req.json();
    const { status, result, errorMessage } = body;

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("comparisons")
      .update({
        status,
        result,
        error_message: errorMessage ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error || !data) throw error;

    logInfo("✅ Comparison updated", { comparisonId: id });
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    logError("❌ Failed to update comparison", { comparisonId: id, error: err?.message });
    return NextResponse.json(
      { error: err?.message || "Failed to update comparison" },
      { status: 500 },
    );
  }
}

// 🗑️ DELETE: حذف مقارنة
export async function DELETE(req: NextRequest, context: any) {
  const { params } = context as RouteContext;
  const { id } = params;
  if (!id) return NextResponse.json({ error: "Missing comparison id" }, { status: 400 });

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("comparisons").delete().eq("id", id);

    if (error) throw error;

    logInfo("✅ Comparison deleted", { comparisonId: id });
    return NextResponse.json({ success: true, message: "Comparison deleted successfully" });
  } catch (err: any) {
    logError("❌ Failed to delete comparison", { comparisonId: id, error: err?.message });
    return NextResponse.json(
      { error: err?.message || "Failed to delete comparison" },
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
      .from("comparisons")
      .select("status, created_at")
      .eq("id", id)
      .single();

    if (!data) return new NextResponse(null, { status: 404 });

    return new NextResponse(null, {
      status: 200,
      headers: {
        "X-Status": data.status ?? "unknown",
        "X-Created-At": data.created_at ?? "",
      },
    });
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}

// 📤 POST: تصدير نتيجة المقارنة
export async function POST(req: NextRequest, context: any) {
  const { params } = context as RouteContext;
  const { id } = params;
  if (!id) return NextResponse.json({ error: "Missing comparison id" }, { status: 400 });

  try {
    const body = await req.json();
    const { format } = body;

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("comparisons")
      .select("result")
      .eq("id", id)
      .single();

    if (error || !data) throw error;

    let output: string;
    switch (format) {
      case "json":
        output = JSON.stringify(data.result, null, 2);
        break;
      case "csv":
        const keys = Object.keys(data.result || {});
        const values = Object.values(data.result || {});
        output = `${keys.join(",")}\n${values.join(",")}`;
        break;
      case "md":
        output =
          `# 📊 Comparison Result\n\n` +
          Object.entries(data.result || {})
            .map(([key, value]) => `- **${key}**: ${value}`)
            .join("\n");
        break;
      default:
        return NextResponse.json(
          { error: `Unsupported export format: ${format}` },
          { status: 400 },
        );
    }

    logInfo("✅ Comparison exported", { comparisonId: id, format });
    return NextResponse.json({ success: true, data: output });
  } catch (err: any) {
    logError("❌ Failed to export comparison", { comparisonId: id, error: err?.message });
    return NextResponse.json(
      { error: err?.message || "Failed to export comparison" },
      { status: 500 },
    );
  }
}
