"use server";

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Octokit } from "@octokit/rest";
import crypto from "crypto";
import logger from "@/lib/utils/logger";
import { Upload } from "@/features/user/types/user";
import { enforceRateLimit, RateLimitError } from "@/lib/utils/rateLimiter";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const owner = "Mohmed-ElZehiry";
const repo = "Project-CodeGCT";

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

// POST: رفع ملف وتخزينه على GitHub + DB
export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user)
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    try {
      await enforceRateLimit({
        key: `upload:${user.id}`,
        limit: 10,
        windowMs: 60_000,
        message: "لقد تجاوزت الحد المسموح لعدد عمليات الرفع. يرجى المحاولة لاحقًا.",
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

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const projectIdRaw = formData.get("projectId");
    const newProjectNameRaw = formData.get("newProjectName");
    const newProjectDescriptionRaw = formData.get("newProjectDescription");

    let projectId =
      projectIdRaw && projectIdRaw !== "null" && projectIdRaw !== "" ? String(projectIdRaw) : null;
    if (!file)
      return NextResponse.json({ success: false, error: "لم يتم اختيار أي ملف" }, { status: 400 });

    const fileExt = file.name.split(".").pop()?.toLowerCase() || "";
    const allowedExtensions = ["zip"];
    if (!allowedExtensions.includes(fileExt)) {
      return NextResponse.json(
        { success: false, error: "⚠️ يُسمح برفع ملفات ZIP فقط." },
        { status: 400 },
      );
    }
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: "حجم الملف كبير جداً (الحد الأقصى 100MB)" },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);
    const checksum = crypto.createHash("sha256").update(fileBuffer).digest("hex");

    const baseName = file.name.replace(/\.[^/.]+$/, "");
    const finalFilename = `${baseName}_${Date.now()}.${fileExt}`;

    if (projectId) {
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("id, user_id")
        .eq("id", projectId)
        .single();

      if (projectError || !project || project.user_id !== user.id) {
        return NextResponse.json(
          { success: false, error: "⚠️ المشروع المحدد غير متاح أو لا يخص المستخدم الحالي" },
          { status: 400 },
        );
      }
    } else if (newProjectNameRaw && String(newProjectNameRaw).trim().length > 0) {
      const newProjectName = String(newProjectNameRaw).trim();
      const newProjectDescription = newProjectDescriptionRaw
        ? String(newProjectDescriptionRaw).trim()
        : null;

      const { data: createdProject, error: createProjectError } = await supabase
        .from("projects")
        .insert({
          name: newProjectName,
          description: newProjectDescription,
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (createProjectError || !createdProject) {
        logger.logError("Failed to create project during upload", {
          error: createProjectError?.message,
        });
        return NextResponse.json(
          { success: false, error: "تعذر إنشاء المشروع الجديد. يرجى المحاولة مرة أخرى" },
          { status: 500 },
        );
      }

      projectId = createdProject.id;
    }

    let nextVersion = 1;
    if (projectId) {
      const { data: latestUpload, error: versionError } = await supabase
        .from("uploads")
        .select("version")
        .eq("project_id", projectId)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (versionError) {
        logger.logError("Failed to fetch latest upload version", { error: versionError });
        return NextResponse.json(
          { success: false, error: "تعذر تحديد رقم الإصدار التالي للمشروع" },
          { status: 500 },
        );
      }

      nextVersion = (latestUpload?.version ?? 0) + 1;
    }

    // تجهيز Release دائم
    const releases = await octokit.repos.listReleases({ owner, repo, per_page: 1 });
    const release =
      releases.data.length > 0
        ? releases.data[0]
        : (
            await octokit.repos.createRelease({
              owner,
              repo,
              tag_name: "v1.0.0",
              name: "Permanent Storage",
            })
          ).data;

    // رفع الملف كـ Asset
    const asset = await octokit.repos.uploadReleaseAsset({
      owner,
      repo,
      release_id: release.id,
      name: finalFilename,
      data: fileBuffer as any,
      headers: {
        "content-type": "application/octet-stream",
        "content-length": fileBuffer.length,
      },
    });

    const assetUrl = asset.data.browser_download_url;

    // تسجيل في DB
    const { data, error } = await supabase
      .from("uploads")
      .insert({
        user_id: user.id,
        project_id: projectId,
        original_filename: file.name,
        file_size: file.size,
        checksum,
        version: nextVersion,
        status: "pending",
        uploaded_at: new Date().toISOString(),
        github_url: assetUrl,
        source_type: "direct",
      })
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data: mapUploadDBToUpload(data) }, { status: 201 });
  } catch (err: any) {
    logger.logError("Upload error", { error: err });
    if (err instanceof RateLimitError) {
      return NextResponse.json({ success: false, error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { success: false, error: err?.message || "Unknown server error" },
      { status: 500 },
    );
  }
}

// GET: جلب كل الملفات الخاصة بالمستخدم الحالي
export async function GET() {
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
      .eq("user_id", user.id)
      .order("uploaded_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data: (data || []).map(mapUploadDBToUpload) });
  } catch (err: any) {
    logger.logError("GET uploads error", { error: err });
    return NextResponse.json(
      { success: false, error: err?.message || "Unknown server error" },
      { status: 500 },
    );
  }
}
