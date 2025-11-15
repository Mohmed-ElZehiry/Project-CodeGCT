// src/features/user/hooks/useUserSettings.ts
"use client";

import { useEffect, useState, useCallback } from "react";
import type { UserSettings } from "../types/user";
import { fetchUserSettings, updateUserSettings } from "../services/settings/settingsService";
import { useAuth } from "@/shared/hooks/useAuth";

export function useUserSettings() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();

  /**
   * ✨ تحميل إعدادات المستخدم
   */
  const loadSettings = useCallback(async () => {
    if (!user?.id) {
      setSettings(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await fetchUserSettings(user.id);
      setSettings(data);
    } catch (err: unknown) {
      console.error("❌ useUserSettings error:", err);
      setError(err instanceof Error ? err.message : "Unexpected error while loading settings");
      setSettings(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  /**
   * ✏️ حفظ/تحديث الإعدادات
   */
  const saveSettings = useCallback(
    async (newSettings: Partial<UserSettings>) => {
      if (!user?.id) return null;
      try {
        setLoading(true);
        const updated = await updateUserSettings(user.id, newSettings);
        setSettings(updated);
        return updated;
      } catch (err: unknown) {
        console.error("❌ saveSettings error:", err);
        setError(err instanceof Error ? err.message : "Unexpected error while saving settings");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user?.id],
  );

  return { settings, loading, error, refetch: loadSettings, saveSettings };
}
