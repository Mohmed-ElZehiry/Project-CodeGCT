// src/features/user/hooks/useProfile.ts
"use client";

import { useEffect, useState, useCallback } from "react";
import type { UserProfile } from "../types/user";
import { fetchUserProfile, updateUserProfile } from "../services/profile/profileService";
import { useAuth } from "@/shared/hooks/useAuth";

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();

  /**
   * ✨ تحميل بيانات الملف الشخصي
   */
  const loadProfile = useCallback(async () => {
    if (!user?.id) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await fetchUserProfile(user.id);
      setProfile(data);
    } catch (err: unknown) {
      console.error("❌ useProfile error:", err);
      setError(err instanceof Error ? err.message : "Unexpected error while loading profile");
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  /**
   * ✏️ تحديث بيانات الملف الشخصي
   */
  const updateProfileHandler = useCallback(
    async (updates: Partial<UserProfile>) => {
      if (!user?.id) return null;
      try {
        setLoading(true);
        const updated = await updateUserProfile(user.id, updates);
        setProfile(updated);
        return updated;
      } catch (err: unknown) {
        console.error("❌ updateProfile error:", err);
        setError(err instanceof Error ? err.message : "Unexpected error while updating profile");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user?.id],
  );

  return { profile, loading, error, refetch: loadProfile, updateProfile: updateProfileHandler };
}
