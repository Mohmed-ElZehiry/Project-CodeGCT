"use server";

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { addStep } from "@/features/user/services/uploads/uploadStepsService";
import { listProjectAnalyses } from "@/features/user/services/reports/projectAnalysisService.server";
import { runAnalysisPipeline } from "@/features/user/services/reports/analysisPipeline";
import { enforceRateLimit, RateLimitError } from "@/lib/utils/rateLimiter";

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    const analyses = await listProjectAnalyses(id);
    return NextResponse.json({ success: true, data: analyses });
  } catch (err: any) {
    console.error("GET /projects/[id]/analyses error:", err);
    if (err instanceof RateLimitError) {
      return NextResponse.json({ success: false, error: err.message }, { status: err.status });
    }

    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id: rawProjectId } = await context.params;
  const body = await req.json().catch(() => ({}));
  const { uploadId, format } = body;

  if (!uploadId) {
    return NextResponse.json({ success: false, error: "Missing uploadId" }, { status: 400 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
      await enforceRateLimit({
        key: `analysis:${user.id}`,
        limit: 5,
        windowMs: 60_000,
        message: "لقد تجاوزت الحد المسموح لتشغيل التحليل. يرجى المحاولة لاحقًا.",
      });
    } catch (error) {
      if (error instanceof RateLimitError) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: error.status },
        );
      }
      throw error;
    }

    const projectId = rawProjectId === "null" ? null : rawProjectId;

    const { data: upload, error: uploadErr } = await supabase
      .from("uploads")
      .select("*")
      .eq("id", uploadId)
      .eq("user_id", user.id)
      .single();

    if (uploadErr || !upload) {
      return NextResponse.json(
        { success: false, error: "Upload not found or unauthorized" },
        { status: 404 },
      );
    }

    if (projectId && upload.project_id && upload.project_id !== projectId) {
      return NextResponse.json(
        { success: false, error: "Upload does not belong to the provided project" },
        { status: 403 },
      );
    }

    if (!upload.github_url) {
      return NextResponse.json(
        { success: false, error: "Upload is missing a download URL" },
        { status: 422 },
      );
    }

    await supabase
      .from("uploads")
      .update({ status: "analyzing", error_message: null, error_code: null })
      .eq("id", uploadId);

    await addStep(
      uploadId,
      "analysis",
      { message: "Analysis started" },
      "system",
      upload.github_url,
      "running",
    );

    const pipelineResult = await runAnalysisPipeline({
      uploadId,
      userId: user.id,
      projectId: upload.project_id ?? projectId ?? null,
      downloadUrl: upload.github_url,
      archiveFilename: upload.original_filename ?? `upload-${uploadId}`,
    });

    await supabase
      .from("uploads")
      .update({ status: "ready", analyzed_at: new Date().toISOString() })
      .eq("id", uploadId);

    return NextResponse.json(
      { success: true, data: pipelineResult.report, format: format || "json" },
      { status: 201 },
    );
  } catch (err: any) {
    console.error("POST /projects/[id]/analyses error:", err);

    if (uploadId) {
      await addStep(uploadId, "analysis", { error: err?.message }, "system", undefined, "error");
      const supabase = await createSupabaseServerClient();
      await supabase
        .from("uploads")
        .update({ status: "failed", error_message: err?.message || "Analysis failed" })
        .eq("id", uploadId);
    }

    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
