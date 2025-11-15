import { NextResponse } from "next/server";
import { getProjectFileById } from "@/features/user/services/projectFilesService";

type RouteContext = {
  params: {
    id: string;
    fileId: string;
  };
};

/**
 * ✅ GET /api/user/projects/[id]/files/[fileId]
 * جلب تفاصيل ملف واحد داخل المشروع
 */
export async function GET(_req: Request, context: any) {
  try {
    const { params } = context as RouteContext;
    const file = await getProjectFileById(params.id, params.fileId);
    return NextResponse.json(file);
  } catch (err: any) {
    console.error("❌ GET /projects/[id]/files/[fileId] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
