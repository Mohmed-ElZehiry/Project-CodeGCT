import { NextResponse } from "next/server";
import { getProjectFiles } from "@/features/user/services/projectFilesService";

type RouteContext = {
  params: {
    id: string;
  };
};

/**
 * ✅ GET /api/user/projects/[id]/files
 * جلب كل الملفات الخاصة بمشروع
 */
export async function GET(_req: Request, context: any) {
  try {
    const { params } = context as RouteContext;
    const files = await getProjectFiles(params.id);
    return NextResponse.json(files);
  } catch (err: any) {
    console.error("❌ GET /projects/[id]/files error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
