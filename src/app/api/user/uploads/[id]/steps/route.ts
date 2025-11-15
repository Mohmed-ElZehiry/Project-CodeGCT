"use server";

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logError, logInfo } from "@/lib/utils/logger";
import { UploadStep } from "@/features/user/types/user";

type RouteContext = {
  params: {
    id: string;
  };
};

function mapStepDBToStep(step: any): UploadStep {
  return {
    id: step.id,
    uploadId: step.upload_id,
    step: step.step,
    outcome: step.outcome,
    createdAt: step.created_at,
    details: step.details || undefined,
    actor: step.actor || undefined,
    link: step.link || undefined,
    statusCode: step.status_code || undefined,
    durationMs: step.duration_ms || undefined,
    category: step.category || undefined,
  };
}

const allowedOutcomes = ["pending", "running", "done", "error"] as const;

// GET: جلب خطوات Upload معين
export async function GET(req: NextRequest, context: any) {
  const { params } = context as RouteContext;
  const { id } = params;
  if (!id)
    return NextResponse.json({ success: false, error: "Missing upload id" }, { status: 400 });

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("upload_steps")
      .select("*")
      .eq("upload_id", id)
      .order("created_at", { ascending: true });

    if (error) throw error;

    logInfo("Upload steps listed", { uploadId: id, count: data?.length || 0 });
    return NextResponse.json({ success: true, data: (data || []).map(mapStepDBToStep) });
  } catch (err: any) {
    logError("Failed to list upload steps", { uploadId: id, error: err?.message });
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to list steps" },
      { status: 500 },
    );
  }
}

// POST: إضافة خطوة جديدة
export async function POST(req: NextRequest, context: any) {
  const { params } = context as RouteContext;
  const { id } = params;
  if (!id)
    return NextResponse.json({ success: false, error: "Missing upload id" }, { status: 400 });

  try {
    const body = await req.json();
    const {
      step,
      details,
      actor,
      link,
      outcome = "pending",
      statusCode,
      durationMs,
      category,
    } = body;
    if (!step)
      return NextResponse.json({ success: false, error: "Missing step type" }, { status: 400 });
    if (!allowedOutcomes.includes(outcome))
      return NextResponse.json({ success: false, error: "Invalid outcome value" }, { status: 400 });

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("upload_steps")
      .insert({
        upload_id: id,
        step,
        details: details ?? null,
        actor: actor ?? null,
        link: link ?? null,
        outcome,
        status_code: statusCode ?? null,
        duration_ms: durationMs ?? null,
        category: category ?? null,
        created_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error || !data) throw error;

    // مزامنة حالة الـ Upload
    await supabase.from("uploads").update({ status: outcome }).eq("id", id);

    logInfo("Upload step added", { uploadId: id, step });
    return NextResponse.json({ success: true, data: mapStepDBToStep(data) }, { status: 201 });
  } catch (err: any) {
    logError("Failed to add upload step", { uploadId: id, error: err?.message });
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to add step" },
      { status: 500 },
    );
  }
}

// PATCH: تحديث خطوة
export async function PATCH(req: NextRequest, context: any) {
  const { params } = context as RouteContext;
  const { id } = params;
  if (!id)
    return NextResponse.json({ success: false, error: "Missing upload id" }, { status: 400 });

  try {
    const body = await req.json();
    const { stepId, details, actor, link, outcome, statusCode, durationMs, category } = body;
    if (!stepId)
      return NextResponse.json({ success: false, error: "Missing stepId" }, { status: 400 });
    if (outcome && !allowedOutcomes.includes(outcome))
      return NextResponse.json({ success: false, error: "Invalid outcome value" }, { status: 400 });

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("upload_steps")
      .update({
        details: details ?? null,
        actor: actor ?? null,
        link: link ?? null,
        outcome: outcome ?? null,
        status_code: statusCode ?? null,
        duration_ms: durationMs ?? null,
        category: category ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", stepId)
      .eq("upload_id", id)
      .select("*")
      .single();

    if (error || !data) throw error;

    if (outcome) await supabase.from("uploads").update({ status: outcome }).eq("id", id);

    logInfo("Upload step updated", { uploadId: id, stepId });
    return NextResponse.json({ success: true, data: mapStepDBToStep(data) });
  } catch (err: any) {
    logError("Failed to update upload step", { uploadId: id, error: err?.message });
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to update step" },
      { status: 500 },
    );
  }
}

// DELETE: حذف خطوة
export async function DELETE(req: NextRequest, context: any) {
  const { params } = context as RouteContext;
  const { id } = params;
  if (!id)
    return NextResponse.json({ success: false, error: "Missing upload id" }, { status: 400 });

  try {
    const body = await req.json();
    const { stepId } = body;
    if (!stepId)
      return NextResponse.json({ success: false, error: "Missing stepId" }, { status: 400 });

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("upload_steps")
      .delete()
      .eq("id", stepId)
      .eq("upload_id", id);

    if (error) throw error;

    logInfo("Upload step deleted", { uploadId: id, stepId });
    return NextResponse.json({ success: true, message: "Step deleted successfully" });
  } catch (err: any) {
    logError("Failed to delete upload step", { uploadId: id, error: err?.message });
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to delete step" },
      { status: 500 },
    );
  }
}
