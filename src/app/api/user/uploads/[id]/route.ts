"use server";

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import logger from "@/lib/utils/logger";
import { Upload } from "@/features/user/types/user";

function mapUploadDBToUpload(upload: any): Upload {
  return {
    id: upload.id,
    userId: upload.user_id,
    projectId: upload.project_id || undefined,
    sourceType: upload.source_type,
    originalFilename: upload.original_filename,
    fileSize: upload.file_size || undefined,
    githubUrl: upload.github_url || undefined,
    checksum: upload.checksum || undefined,
    version: upload.version,
    status: upload.status,
    uploadedAt: upload.uploaded_at,
    errorMessage: upload.error_message || undefined,
    errorCode: upload.error_code || undefined,
    metadata: upload.metadata || undefined,
  };
}

// GET: تفاصيل Upload واحد
export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!id)
    return NextResponse.json({ success: false, error: "Missing upload id" }, { status: 400 });

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user)
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("uploads")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error) throw error;
    if (!data)
      return NextResponse.json({ success: false, error: "Upload not found" }, { status: 404 });

    return NextResponse.json({ success: true, data: mapUploadDBToUpload(data) });
  } catch (err: any) {
    logger.logError("Upload GET error", { error: err });
    return NextResponse.json(
      { success: false, error: err?.message || "Unknown error" },
      { status: 500 },
    );
  }
}

// PATCH: تحديث حالة Upload
export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!id)
    return NextResponse.json({ success: false, error: "Missing upload id" }, { status: 400 });

  try {
    const body = await req.json();
    const { status, errorMessage, errorCode, metadata } = body;
    if (!status)
      return NextResponse.json({ success: false, error: "Missing status field" }, { status: 400 });

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user)
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("uploads")
      .update({
        status,
        error_message: errorMessage ?? null,
        error_code: errorCode ?? null,
        metadata: metadata ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data: mapUploadDBToUpload(data) });
  } catch (err: any) {
    logger.logError("Upload PATCH error", { error: err });
    return NextResponse.json(
      { success: false, error: err?.message || "Unknown error" },
      { status: 500 },
    );
  }
}

// DELETE: حذف Upload
export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!id)
    return NextResponse.json({ success: false, error: "Missing upload id" }, { status: 400 });

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user)
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { error } = await supabase.from("uploads").delete().eq("id", id).eq("user_id", user.id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: "Upload deleted successfully" });
  } catch (err: any) {
    logger.logError("Upload DELETE error", { error: err });
    return NextResponse.json(
      { success: false, error: err?.message || "Unknown error" },
      { status: 500 },
    );
  }
}
