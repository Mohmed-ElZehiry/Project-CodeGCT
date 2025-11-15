"use client";

// Force this module to stay on the client to avoid Edge runtime warnings
export const runtime = "client";

import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import logger from "../utils/logger";
import { createClient as createBrowserSupabaseClient } from "./client";

type Role = Database["public"]["Enums"]["user_role"];

type SupabaseContext = {
  supabase: SupabaseClient<Database>;
  user: User | null;
  userId: string | null;
  role: Role;
  isAuthenticated: boolean;
  loading: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  setRole: React.Dispatch<React.SetStateAction<Role>>;
};

const Context = createContext<SupabaseContext | undefined>(undefined);

type SupabaseProviderProps = {
  children: React.ReactNode;
  initialUser?: User | null;
  initialRole?: Role;
};

export function SupabaseProvider({
  children,
  initialUser = null,
  initialRole = "user",
}: SupabaseProviderProps) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [user, setUser] = useState<User | null>(() => initialUser ?? null);
  const [role, setRole] = useState<Role>(() => initialRole ?? "user");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const resolveRole = async (sessionUser: User) => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", sessionUser.id)
          .single();

        if (!isMounted) return;

        if (error) {
          logger.logWarn?.("Failed to fetch profile role", {
            error: error.message,
            userId: sessionUser.id,
          });
        }

        const dbRole = data?.role as Role | undefined;
        const metadataRole = sessionUser.user_metadata?.role as Role | undefined;
        setRole(dbRole ?? metadataRole ?? "user");
      } catch (err: unknown) {
        logger.logError("Error resolving user role", { err });
        if (isMounted) {
          setRole("user");
        }
      }
    };

    const applySession = async (sessionUser: User | null) => {
      if (!isMounted) return;

      if (sessionUser) {
        setUser(sessionUser);
        await resolveRole(sessionUser);
      } else {
        setUser(null);
        setRole("user");
      }
    };

    const init = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        await applySession(session?.user ?? null);
      } catch (error) {
        logger.logError("Error initializing auth", { error });
        if (isMounted) {
          setUser(null);
          setRole("user");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void applySession(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`profiles-role-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          const updatedRole = (payload.new as { role?: Role | null })?.role;
          if (updatedRole) {
            setRole(updatedRole as Role);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, user]);

  return (
    <Context.Provider
      value={{
        supabase,
        user,
        userId: user?.id ?? null,
        role,
        isAuthenticated: !!user,
        loading,
        setUser,
        setRole,
      }}
    >
      {children}
    </Context.Provider>
  );
}

export const useSupabase = () => {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("useSupabase must be used inside SupabaseProvider");
  return ctx;
};
