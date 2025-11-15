"use client";

import { useSupabase } from "@/lib/supabase/provider";
import { User } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type Role = Database["public"]["Enums"]["user_role"];

export function useAuth() {
  const { supabase, user, role, setUser, setRole, isAuthenticated, loading } = useSupabase();

  const currentUser: User | null = user ?? null;

  return {
    supabase,
    user: currentUser,
    userId: currentUser?.id,
    role,
    isAuthenticated,
    loading,
    setUser,
    setRole,
  };
}
