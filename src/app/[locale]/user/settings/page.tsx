"use client";

import { useSupabase } from "@/lib/supabase/provider";
import { useState } from "react";

export default function UserSettingsPage() {
  const { user, role } = useSupabase();
  const [apiKeys] = useState([{ id: "key-1", label: "Integration Key", lastUsed: "2025-05-12" }]);
  const [notifications] = useState({ email: true, slack: false, webhooks: false });

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold">⚙️ إعدادات الحساب</h1>
        <p className="text-sm text-muted-foreground">
          تحكم في مفاتيح الـ API، الإشعارات، وأمان الحساب.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">📧 معلومات الحساب</h2>
        <div className="rounded-lg border border-border bg-card p-4 text-sm space-y-1">
          <p>
            <strong>البريد:</strong> {user?.email ?? "غير متوفر"}
          </p>
          <p>
            <strong>الدور الحالي:</strong> {role}
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">🔐 مفاتيح الـ API</h2>
        <div className="rounded-lg border border-border bg-card p-4 text-sm space-y-4">
          <p className="text-muted-foreground">يمكنك إدارة مفاتيح الوصول للدمج مع أدوات خارجية.</p>
          <ul className="space-y-3">
            {apiKeys.map((key) => (
              <li
                key={key.id}
                className="flex items-center justify-between rounded-md border border-input p-3"
              >
                <div>
                  <p className="font-medium">{key.label}</p>
                  <p className="text-xs text-muted-foreground">آخر استخدام: {key.lastUsed}</p>
                </div>
                <button
                  type="button"
                  className="rounded-md bg-destructive px-3 py-1 text-xs text-white"
                >
                  إلغاء
                </button>
              </li>
            ))}
          </ul>
          <button type="button" className="rounded-md bg-primary px-4 py-2 text-sm text-white">
            ➕ إنشاء مفتاح جديد
          </button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">🔔 تفضيلات الإشعارات</h2>
        <div className="rounded-lg border border-border bg-card p-4 text-sm space-y-3">
          <div className="flex items-center justify-between">
            <span>إشعارات البريد الإلكتروني</span>
            <span className="text-xs text-muted-foreground">
              {notifications.email ? "مفعّل" : "معطّل"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>تنبيهات Slack</span>
            <span className="text-xs text-muted-foreground">
              {notifications.slack ? "مفعّل" : "معطّل"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Webhooks</span>
            <span className="text-xs text-muted-foreground">
              {notifications.webhooks ? "مفعّل" : "معطّل"}
            </span>
          </div>
          <button type="button" className="rounded-md bg-primary px-4 py-2 text-sm text-white">
            تعديل التفضيلات
          </button>
        </div>
      </section>
    </div>
  );
}
