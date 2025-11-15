import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import logger from "@/lib/utils/logger";
import type { Json } from "@/lib/supabase/database.types";

type RolePermission = {
  role: string;
  description: string | null;
  permissions: Json extends (infer T)[] | null ? T[] | null : string[] | null;
};
type PatchContext = {
  params: {
    role: string;
  };
};

function mapRolePermission(row: RolePermission) {
  return {
    role: row.role,
    description: row.description ?? null,
    permissions: row.permissions ?? [],
  };
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await (supabase.from as any)("role_permissions")
      .select("role, description, permissions")
      .order("role");

    if (error) {
      logger.logError("admin.roles: failed to fetch", { error: error.message });
      return NextResponse.json(
        { success: false, error: error.message, data: null },
        { status: 500 },
      );
    }

    const payload = (data ?? []).map(mapRolePermission);
    logger.logInfo("admin.roles: retrieved", { count: payload.length });

    return NextResponse.json({ success: true, data: payload, error: null });
  } catch (error) {
    logger.logError("admin.roles: unexpected error", { error });
    return NextResponse.json(
      { success: false, error: "Failed to fetch roles", data: null },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest, context: any) {
  const { params } = context as PatchContext;
  const role = params.role as RolePermission["role"];

  if (!role) {
    return NextResponse.json(
      { success: false, error: "Missing role", data: null },
      { status: 400 },
    );
  }

  try {
    const body = (await req.json()) as { permissions?: string[]; description?: string | null };

    if (!body.permissions) {
      return NextResponse.json(
        { success: false, error: "permissions field is required", data: null },
        { status: 400 },
      );
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await (supabase.from as any)("role_permissions")
      .update({
        permissions: body.permissions,
        description: body.description ?? null,
      })
      .eq("role", role)
      .select("role, description, permissions")
      .single();

    if (error || !data) {
      logger.logError("admin.roles: failed to update", { role, error: error?.message });
      return NextResponse.json(
        { success: false, error: error?.message ?? "Role not found", data: null },
        { status: error?.message ? 500 : 404 },
      );
    }

    const mapped = mapRolePermission(data as RolePermission);
    logger.logInfo("admin.roles: updated", {
      role: mapped.role,
      permissions: mapped.permissions.length,
    });

    return NextResponse.json({ success: true, data: mapped, error: null });
  } catch (error) {
    logger.logError("admin.roles: unexpected error on update", { role, error });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update role",
        data: null,
      },
      { status: 500 },
    );
  }
}
