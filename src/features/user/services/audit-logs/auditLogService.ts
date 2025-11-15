import { createClient } from "@/lib/supabase/client";
import type { UserActivity, UserActivityDB, AuditAction } from "../../types/user";

const supabase = createClient();

/**
 * 🗂️ Map DB row (snake_case) → Frontend type (camelCase)
 */
function mapActivityFromDB(db: UserActivityDB): UserActivity {
  return {
    id: db.id,
    userId: db.user_id,
    action: db.action as AuditAction,
    metadata: db.metadata,
    createdAt: new Date(db.created_at),
  };
}

/**
 * 📥 جلب أنشطة المستخدم
 */
export async function listAuditLogs(userId: string, limit = 50): Promise<UserActivity[]> {
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, user_id, action, metadata, created_at")
    .eq("user_id", userId as any)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("❌ listAuditLogs error:", error.message, error.details);
    throw new Error(`Failed to fetch audit logs for user ${userId}`);
  }

  return (data as UserActivityDB[]).map(mapActivityFromDB);
}

/**
 * ✏️ تسجيل نشاط جديد للمستخدم
 */
export async function logUserActivity(
  userId: string,
  action: AuditAction,
  metadata: Record<string, any> = {},
): Promise<UserActivity> {
  const { data, error } = await supabase
    .from("audit_logs")
    .insert({
      user_id: userId,
      action,
      metadata,
      created_at: new Date().toISOString(),
    } as any)
    .select("id, user_id, action, metadata, created_at")
    .single();

  if (error || !data) {
    console.error("❌ logUserActivity error:", error?.message, error?.details);
    throw new Error(`Failed to log activity for user ${userId}`);
  }

  return mapActivityFromDB(data as UserActivityDB);
}
// في آخر الملف
export { listAuditLogs as fetchUserActivity };
