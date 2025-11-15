import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import logger from "@/lib/utils/logger";
import type { Database } from "@/lib/supabase/database.types";

type SystemSettingRow = Database["public"]["Tables"]["system_settings"]["Row"];
type PatchContext = {
  params: {
    key: string;
  };
};

function mapSetting(row: any) {
  return {
    key: row.key,
    value: row.value,
    category: row.category,
    editable: row.is_editable,
    updatedAt: row.updated_at,
  };
}

// GET /api/admin/system_settings
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("system_settings")
      .select("key, value, category, is_editable, updated_at")
      .order("category", { ascending: true })
      .order("key", { ascending: true });

    if (error) {
      logger.logError("admin.systemSettings: failed to fetch", { error: error.message });
      return NextResponse.json(
        { success: false, error: error.message, data: null },
        { status: 500 },
      );
    }

    const settings = (data ?? []).map(mapSetting);

    logger.logInfo("admin.systemSettings: retrieved", { count: settings.length });

    return NextResponse.json({ success: true, data: settings, error: null });
  } catch (error) {
    logger.logError("admin.systemSettings: unexpected error", { error });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch settings",
        data: null,
      },
      { status: 500 },
    );
  }
}

// PATCH /api/admin/system_settings/[key]
export async function PATCH(req: NextRequest, context: any) {
  const { params } = context as PatchContext;
  const settingKey = params.key;

  if (!settingKey) {
    return NextResponse.json({ success: false, error: "Missing key", data: null }, { status: 400 });
  }

  try {
    const payload = (await req.json()) as { value?: SystemSettingRow["value"] };

    if (!payload || !Object.prototype.hasOwnProperty.call(payload, "value")) {
      return NextResponse.json(
        { success: false, error: "Invalid payload: value is required", data: null },
        { status: 400 },
      );
    }

    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("system_settings")
      .update({ value: payload.value, updated_at: new Date().toISOString() })
      .eq("key", settingKey)
      .select("key, value, category, is_editable, updated_at")
      .single();

    if (error || !data) {
      logger.logError("admin.systemSettings: failed to update", {
        error: error?.message,
        key: settingKey,
      });
      return NextResponse.json(
        { success: false, error: error?.message ?? "Setting not found", data: null },
        { status: error?.message ? 500 : 404 },
      );
    }

    const mapped = mapSetting(data);

    logger.logInfo("admin.systemSettings: updated", { key: mapped.key });

    return NextResponse.json({ success: true, data: mapped, error: null });
  } catch (error) {
    logger.logError("admin.systemSettings: unexpected error", { key: settingKey, error });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update setting",
        data: null,
      },
      { status: 500 },
    );
  }
}
